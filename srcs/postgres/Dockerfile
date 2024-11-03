FROM postgres
EXPOSE 5433

COPY ./conf/postgresql.conf /var/lib/postgresql/data/
COPY . /var/www/
RUN chmod +x /var/www/setup.sh

USER postgres
