# Hướng Dẫn Triển Khai Mono Docker - Tiếng Việt

## Tổng Quan

Hệ thống YOLO Check-In Platform hiện đã hỗ trợ **một Docker image duy nhất** chứa toàn bộ stack:
- ✅ Frontend (Next.js)
- ✅ Backend (FastAPI)
- ✅ PostgreSQL database
- ✅ Nginx reverse proxy

## Đặc Điểm

✅ **Một container duy nhất** - Dễ triển khai và quản lý  
✅ **Đa kiến trúc** - Hỗ trợ AMD64 (x86) và ARM64 (Raspberry Pi, AWS Graviton)  
✅ **CI/CD tự động** - Tự động build qua GitHub Actions  
✅ **Cấu hình đơn giản** - Chỉ cần một file .env  
✅ **Production ready** - Đã tối ưu cho môi trường production  

## Cài Đặt Nhanh

### Bước 1: Pull Docker Image

```bash
# Clone repository
git clone https://github.com/np2023v2/yolo-checkin.git
cd yolo-checkin

# Pull image (tự động chọn kiến trúc phù hợp)
docker pull ghcr.io/np2023v2/yolo-checkin:latest
```

### Bước 2: Cấu Hình

Tạo file cấu hình từ template:

```bash
cp docker/mono/.env.mono.example .env.mono
```

Chỉnh sửa `.env.mono`:

```env
# Database
POSTGRES_USER=yolouser
POSTGRES_PASSWORD=matkhau_manh  # Đổi thành mật khẩu mạnh
POSTGRES_DB=yolodb

# Bảo mật - TẠO MỚI BẰNG: openssl rand -hex 32
SECRET_KEY=your-secret-key-change-in-production

# API
API_V1_STR=/api/v1

# Thư mục lưu trữ
UPLOAD_DIR=/app/uploads
MODEL_DIR=/app/models
DATASET_DIR=/app/datasets
```

### Bước 3: Chạy Container

```bash
docker-compose -f docker-compose.mono.yml up -d
```

### Bước 4: Truy Cập

- **Ứng dụng**: http://localhost
- **API Documentation**: http://localhost/docs
- **Database**: localhost:5432 (nếu cần kết nối trực tiếp)

## Build Image Từ Source

Nếu muốn build image từ source code:

```bash
# Build và test
./build-mono.sh

# Chỉ build
./build-mono.sh --build-only

# Build cho ARM64
./build-mono.sh --platform linux/arm64
```

## Triển Khai Cho Các Nền Tảng Khác Nhau

### Raspberry Pi 4/5

```bash
# Cài đặt Docker (nếu chưa có)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Pull và chạy
docker pull ghcr.io/np2023v2/yolo-checkin:latest
docker-compose -f docker-compose.mono.yml up -d
```

💡 **Lưu ý**: Raspberry Pi 4 cần ít nhất 4GB RAM, khuyến nghị 8GB

### AWS Graviton (ARM64)

```bash
# Launch instance t4g.medium hoặc lớn hơn
# Ubuntu 22.04 LTS ARM64

# Cài đặt Docker
curl -fsSL https://get.docker.com | sh

# Triển khai
docker pull ghcr.io/np2023v2/yolo-checkin:latest
docker-compose -f docker-compose.mono.yml up -d
```

### VPS/Server Thông Thường (x86)

```bash
# Bất kỳ VPS nào có Docker
docker pull ghcr.io/np2023v2/yolo-checkin:latest
docker-compose -f docker-compose.mono.yml up -d
```

## Triển Khai Production với SSL

### Sử dụng Nginx Reverse Proxy

Tạo file config Nginx `/etc/nginx/sites-available/yolo-checkin`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Cài đặt SSL certificate với Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Cấu Trúc Dữ Liệu

Tất cả dữ liệu được lưu trong Docker volumes:

- `postgres_data` - Dữ liệu database
- `uploads_data` - Ảnh và file upload
- `models_data` - Model đã train
- `datasets_data` - Dataset

## Sao Lưu Dữ Liệu

### Sao lưu Database

```bash
docker exec yolo-checkin-mono pg_dump -U yolouser yolodb > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker exec -i yolo-checkin-mono psql -U yolouser yolodb
```

### Sao lưu tất cả volumes

```bash
docker run --rm \
  -v yolo-checkin_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Giám Sát và Log

### Xem logs

```bash
# Log tổng hợp
docker logs yolo-checkin-mono

# Log từng service
docker exec yolo-checkin-mono tail -f /var/log/backend.out.log
docker exec yolo-checkin-mono tail -f /var/log/frontend.out.log
docker exec yolo-checkin-mono tail -f /var/log/nginx/access.log
```

### Kiểm tra trạng thái services

```bash
docker exec yolo-checkin-mono supervisorctl status
```

### Health check

```bash
curl http://localhost/health
```

## Dừng và Xóa Container

```bash
# Dừng
docker-compose -f docker-compose.mono.yml stop

# Dừng và xóa
docker-compose -f docker-compose.mono.yml down

# Dừng, xóa và xóa volumes (⚠️ MẤT DỮ LIỆU)
docker-compose -f docker-compose.mono.yml down -v
```

## CI/CD - Tự Động Build

Repository đã được cấu hình GitHub Actions để tự động build:

- **Trigger**: Push vào branch `main` hoặc `develop`, hoặc tạo tag `v*`
- **Platforms**: AMD64 và ARM64
- **Registry**: GitHub Container Registry (ghcr.io)
- **Cache**: Sử dụng GitHub Actions cache để build nhanh hơn

Image tự động được push lên: `ghcr.io/np2023v2/yolo-checkin:latest`

## Khắc Phục Sự Cố

### Container không khởi động được

Kiểm tra logs:
```bash
docker logs yolo-checkin-mono
```

### Services không phản hồi

Kiểm tra trạng thái:
```bash
docker exec yolo-checkin-mono supervisorctl status
```

Khởi động lại service:
```bash
docker exec yolo-checkin-mono supervisorctl restart backend
```

### Database connection error

Database cần thời gian khởi tạo (30-60 giây lần đầu). Đợi một chút rồi thử lại.

### Port bị chiếm

Đổi port trong `docker-compose.mono.yml`:
```yaml
ports:
  - "8080:80"  # Dùng port 8080 thay vì 80
```

## Cấu Hình Nâng Cao

### Giới hạn tài nguyên

Thêm vào `docker-compose.mono.yml`:

```yaml
services:
  yolo-checkin-mono:
    # ... config khác
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G
```

### Tăng upload file size

Sửa file `docker/mono/nginx.conf`:
```nginx
client_max_body_size 200M;  # Tăng từ 100M
```

Rebuild image sau khi sửa.

## Tài Liệu Tham Khảo

- **[Hướng dẫn chi tiết (EN)](docker/mono/README.md)**
- **[Chi tiết kỹ thuật (EN)](MONO_DOCKER_IMPLEMENTATION.md)**
- **[Sơ đồ kiến trúc (EN)](ARCHITECTURE_MONO.md)**
- **[Triển khai ARM64 (EN)](examples/deployment/arm64-deployment.md)**
- **[Production SSL (EN)](examples/deployment/production-ssl.md)**

## Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra logs: `docker logs yolo-checkin-mono`
2. Xem tài liệu ở trên
3. Tạo issue tại: https://github.com/np2023v2/yolo-checkin/issues

## Checklist Triển Khai Production

- [ ] Đã đổi `POSTGRES_PASSWORD` thành mật khẩu mạnh
- [ ] Đã tạo `SECRET_KEY` mới bằng `openssl rand -hex 32`
- [ ] Đã cài đặt SSL/TLS (HTTPS)
- [ ] Đã cấu hình firewall
- [ ] Đã thiết lập backup tự động
- [ ] Đã giới hạn tài nguyên container
- [ ] Đã cấu hình monitoring
- [ ] Đã test restore từ backup

## Ví Dụ Triển Khai Hoàn Chỉnh

```bash
# 1. Clone và prepare
git clone https://github.com/np2023v2/yolo-checkin.git
cd yolo-checkin

# 2. Tạo cấu hình
cat > .env.mono <<EOF
POSTGRES_USER=yolouser
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=yolodb
SECRET_KEY=$(openssl rand -hex 32)
API_V1_STR=/api/v1
EOF

# 3. Pull image
docker pull ghcr.io/np2023v2/yolo-checkin:latest

# 4. Chạy
docker-compose -f docker-compose.mono.yml up -d

# 5. Kiểm tra
curl http://localhost/health

# 6. Truy cập
echo "Ứng dụng đã chạy tại: http://localhost"
```

## Tóm Tắt

✅ **Một docker image** chứa toàn bộ: Frontend + Backend + PostgreSQL  
✅ **Chạy ngay** chỉ với một lệnh docker-compose  
✅ **Hỗ trợ ARM64** cho Raspberry Pi, AWS Graviton  
✅ **CI/CD tự động** qua GitHub Actions  
✅ **Production ready** với Nginx, SSL, health checks  
✅ **Dễ sao lưu** với Docker volumes  
✅ **Tài liệu đầy đủ** bằng tiếng Anh và tiếng Việt  

**Trạng thái**: ✅ Đã hoàn thành và sẵn sàng sử dụng  
**Kiến trúc**: AMD64 và ARM64  
**Registry**: ghcr.io/np2023v2/yolo-checkin  
