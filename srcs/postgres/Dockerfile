FROM postgres
EXPOSE 5432
RUN rm -rf /var/lib/postgresql/data/
# COPY ./conf/postgresql.conf /var/lib/postgresql/data/postgresql.conf
COPY ./setup.sh /var/www/
RUN chmod +x /var/www/setup.sh

USER postgres
ENTRYPOINT [ "/var/www/setup.sh" ]
# ENTRYPOINT ["postgres"]
