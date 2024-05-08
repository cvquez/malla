## Crear el archivo config/database.yml

El proyecto no sincroniza el archivo de base de datos

```bash
nano config/database.yml
```

```yml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  timeout: 5000
  username: postgres
  password: postgres
  host: localhost
  port: 5432

development:
  <<: *default
  database: database_dev

test:
  <<: *default
  database: database_test

production:
  <<: *default
  database: database_prod
```
## Configurar las claves de autenticacion para Google

Copiar el .env y definir la clave y el secret

```bash
cp .env.example .env
```

### Instalar requerimientos

```bash
bundle install
yarn install
```

### Iniciar rails

```bash
rails db:create
rails db:migrate
./bin/dev #ejecutar el rails con foreman
```
