# Production Deployment with SSL/TLS

This example shows how to deploy the mono Docker image with SSL/TLS using Nginx as a reverse proxy.

## Architecture

```
Internet → Nginx (with SSL) → Docker Container (Port 8080)
```

## Prerequisites

- Domain name pointing to your server
- Docker and Docker Compose installed
- Certbot for Let's Encrypt

## Step 1: Deploy the Application

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  yolo-checkin:
    image: ghcr.io/np2023v2/yolo-checkin:latest
    container_name: yolo-checkin-prod
    restart: always
    ports:
      - "127.0.0.1:8080:80"  # Only expose to localhost
    environment:
      - POSTGRES_USER=yolouser
      - POSTGRES_PASSWORD=${DB_PASSWORD}  # Use strong password
      - POSTGRES_DB=yolodb
      - SECRET_KEY=${SECRET_KEY}  # Generate with: openssl rand -hex 32
      - API_V1_STR=/api/v1
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - uploads_data:/app/uploads
      - models_data:/app/models
      - datasets_data:/app/datasets
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G

volumes:
  postgres_data:
  uploads_data:
  models_data:
  datasets_data:
```

Create `.env` file:
```env
DB_PASSWORD=your_strong_password_here
SECRET_KEY=your_secret_key_from_openssl_rand_hex_32
```

Start the application:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Step 2: Install and Configure Nginx

Install Nginx:
```bash
sudo apt update
sudo apt install nginx
```

Create Nginx configuration `/etc/nginx/sites-available/yolo-checkin`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    client_max_body_size 100M;

    # Proxy to Docker container
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/yolo-checkin /etc/nginx/sites-enabled/
sudo nginx -t
```

## Step 3: Get SSL Certificate with Let's Encrypt

Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

Get certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts and select:
- Redirect HTTP to HTTPS (option 2)

Test auto-renewal:
```bash
sudo certbot renew --dry-run
```

## Step 4: Start Nginx

```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 5: Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Maintenance

### View Logs
```bash
# Application logs
docker logs yolo-checkin-prod

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup Database
```bash
docker exec yolo-checkin-prod pg_dump -U yolouser yolodb > backup.sql
```

### Update Application
```bash
docker pull ghcr.io/np2023v2/yolo-checkin:latest
docker-compose -f docker-compose.prod.yml up -d
```

### Monitor Resources
```bash
docker stats yolo-checkin-prod
```

## Security Checklist

- [ ] Strong passwords for PostgreSQL
- [ ] Unique SECRET_KEY generated
- [ ] SSL/TLS enabled with valid certificate
- [ ] Firewall configured
- [ ] Regular backups scheduled
- [ ] Container resource limits set
- [ ] Security headers configured in Nginx
- [ ] Log rotation enabled
- [ ] Monitoring set up

## Troubleshooting

### Certificate renewal fails
```bash
sudo certbot renew --force-renewal
```

### 502 Bad Gateway
Check if the container is running:
```bash
docker ps
docker logs yolo-checkin-prod
```

### High memory usage
Adjust resource limits in docker-compose.prod.yml
