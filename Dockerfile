# ==================== 阶段1: 构建前端 ====================
FROM node:20.12.2 AS frontend-builder

WORKDIR /usr/src/app

# 复制前端项目文件
COPY package*.json pnpm-lock.yaml ./
RUN npm install pnpm -g && pnpm install

COPY . .
RUN pnpm build

# ==================== 阶段2: 运行时镜像 ====================
FROM node:20.12.2-slim

# 安装 nginx、supervisor 和 better-sqlite3 编译依赖
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制后端代码（先复制源码，再安装依赖）
WORKDIR /usr/src/server
COPY server/*.js ./
COPY server/package*.json ./
RUN npm install --production

# 复制前端构建产物到 nginx
COPY --from=frontend-builder /usr/src/app/dist /usr/share/nginx/html

# 配置 nginx
RUN echo 'server { \n\
    listen 80; \n\
    server_name localhost; \n\
    \n\
    location / { \n\
        root /usr/share/nginx/html; \n\
        index index.html; \n\
        try_files $uri $uri/ /index.html; \n\
    } \n\
    \n\
    location /api/ { \n\
        proxy_pass http://localhost:3456; \n\
        proxy_set_header X-Real-IP $remote_addr; \n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \n\
        proxy_set_header Host $host; \n\
        proxy_set_header Cookie $http_cookie; \n\
        proxy_set_header X-Forwarded-Proto $scheme; \n\
    } \n\
}' > /etc/nginx/sites-available/default

# 配置 supervisor 同时运行 nginx 和 node
RUN echo '[supervisord] \n\
nodaemon=true \n\
\n\
[program:nginx] \n\
command=nginx -g "daemon off;" \n\
autostart=true \n\
autorestart=true \n\
\n\
[program:node] \n\
command=node /usr/src/server/index.js \n\
directory=/usr/src/server \n\
autostart=true \n\
autorestart=true \n\
stdout_logfile=/dev/stdout \n\
stdout_logfile_maxbytes=0 \n\
stderr_logfile=/dev/stderr \n\
stderr_logfile_maxbytes=0' > /etc/supervisor/conf.d/app.conf

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
