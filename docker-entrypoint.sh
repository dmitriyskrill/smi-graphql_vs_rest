#!/bin/sh
set -eu

npm run prisma:migrate
npm run prisma:seed
exec npm run start:prod
