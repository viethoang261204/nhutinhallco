# Website HALLCO – Như Tín trên Render (Web Service, runtime Docker).
# Apache + PHP để chạy send.php và giữ nguyên .htaccess (nén, cache, 404, chặn file nhạy cảm).
FROM php:8.3-apache

# mbstring và openssl đã có sẵn trong image; bật thêm module mà .htaccess dùng
RUN a2enmod headers expires deflate \
 && sed -ri 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf \
 && sed -ri 's!^Listen 80$!Listen ${PORT}!' /etc/apache2/ports.conf \
 && sed -ri 's!<VirtualHost \*:80>!<VirtualHost *:${PORT}>!' /etc/apache2/sites-available/000-default.conf \
 && echo 'ServerName localhost' > /etc/apache2/conf-enabled/servername.conf \
 && printf 'ServerTokens Prod\nServerSignature Off\n' > /etc/apache2/conf-enabled/z-security.conf \
 && mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
 && printf 'expose_php = Off\ndate.timezone = Asia/Ho_Chi_Minh\n' > "$PHP_INI_DIR/conf.d/site.ini"

# Render đặt PORT (mặc định 10000)
ENV PORT=10000
EXPOSE 10000

COPY --chown=www-data:www-data . /var/www/html/
