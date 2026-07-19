# مرحله ۱: ساخت پروژه
FROM node:22-alpine AS builder

WORKDIR /app

# کپی فایل‌های package
COPY package*.json ./

# نصب وابستگی‌ها
RUN npm install

# کپی کل پروژه
COPY . .

# ساخت پروژه
RUN npm run build

# مرحله ۲: سرو کردن با Nginx
FROM nginx:alpine

# کپی فایل‌های ساخته شده به پوشه Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# کپی کانفیگ Nginx (اختیاری - اگر فایل دارید)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# پورت ۸۰ را در شبکه داخلی Docker باز می‌کند
EXPOSE 80

# اجرای Nginx
CMD ["nginx", "-g", "daemon off;"]