FROM nginx:alpine

# Copy all frontend static files into nginx html dir
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
