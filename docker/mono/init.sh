#!/bin/bash
set -e

echo "=========================================="
echo "YOLO Check-In Platform - Mono Container"
echo "=========================================="

# Initialize PostgreSQL if not already done
if [ ! -f /var/lib/postgresql/data/PG_VERSION ]; then
    echo "Initializing PostgreSQL database..."
    su - postgres -c "/usr/lib/postgresql/15/bin/initdb -D /var/lib/postgresql/data"
fi

# Start PostgreSQL
echo "Starting PostgreSQL..."
su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D /var/lib/postgresql/data -l /var/log/postgresql/postgresql.log start"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if su - postgres -c "psql -lqt" &> /dev/null; then
        echo "PostgreSQL is ready!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

# Create database and user if they don't exist
echo "Setting up database..."
su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DB}'\" | grep -q 1 || psql -c \"CREATE DATABASE ${POSTGRES_DB};\""
su - postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname = '${POSTGRES_USER}'\" | grep -q 1 || psql -c \"CREATE USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';\""
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};\""

# Export environment variables for backend
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"
export REDIS_URL="redis://localhost:6379"

# Create backend .env file
echo "Configuring backend..."
cat > /app/backend/.env <<EOF
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
SECRET_KEY=${SECRET_KEY}
API_V1_STR=${API_V1_STR}
UPLOAD_DIR=${UPLOAD_DIR}
MODEL_DIR=${MODEL_DIR}
DATASET_DIR=${DATASET_DIR}
EOF

# Run database migrations if needed
cd /app/backend
if [ -d "alembic" ]; then
    echo "Running database migrations..."
    python -m alembic upgrade head || echo "No migrations to run or migration failed"
fi

# Configure frontend environment
echo "Configuring frontend..."
export NEXT_PUBLIC_API_URL="http://localhost${API_V1_STR}"

# Start services with supervisor
echo "Starting all services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
