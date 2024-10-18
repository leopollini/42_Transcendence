all: prep_dirs
	@docker-compose -f ./srcs/docker-compose.yml up

down:
	@docker-compose -f ./srcs/docker-compose.yml down

re: prep_dirs
	@docker-compose -f srcs/docker-compose.yml up --build

prep_dirs:
	# Create all directories for databases and services
	# @mkdir -p /path/here

clean:
	@docker stop $$(docker ps -qa);\
	#docker rm $$(docker ps -qa);\
	docker rmi -f $$(docker images -qa);\
	docker volume rm $$(docker volume ls -q);\
	docker network rm $$(docker network ls -q)

	# Destroy all directories
	rm -rf /home/leonardo/data/wordpress

.PHONY: all re down clean