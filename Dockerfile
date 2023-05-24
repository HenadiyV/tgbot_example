# Указываем базовый образ, содержащий Node.js
FROM node:14

# Создаем и переключаемся в рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем все файлы проекта в рабочую директорию контейнера
COPY . .

ENV PORT = 3000

EXPOSE $port
# Опционально: Если ваш бот использует какие-либо конфигурационные файлы,
# вы можете скопировать их в контейнер и указать путь к файлу конфигурации
# COPY config.json .

# Указываем команду, которая будет запущена при старте контейнера
CMD [ "npm", "start" ]
