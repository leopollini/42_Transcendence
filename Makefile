CONTAINERS	= tokenizer receiver postgres request_manager auth user_manager history_manager chat game_data_manager

# ========================================= #
SHELL:=/bin/bash

RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[0;33m
BLUE=\033[0;34m
NC=\033[0m

RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m

all: prep_dirs #stop_containers
	@clear
	@echo -e "$(RED)Rimozione del volume per evitare conflitti...$(NC)";
	# @sudo docker volume rm ct;
	@echo -e "$(YELLOW)configurazione server https locale$(NC)"
	@chmod +x setup/setup_online_website.sh
	@sudo ./setup/setup_online_website.sh
	@echo -e "$(GREEN)configurazione completata$(NC)"
	make -C ./srcs/common_tools/ all
	@echo -e "$(YELLOW)Avvio container Docker...$(NC)"; \
	if [ "$${DETATCH}" = "true" ]; then \
		sudo docker compose -f ./docker-compose.yml up -d; \
	else \
		sudo docker compose -f ./docker-compose.yml up; \
	fi

$(CONTAINERS): prep_dirs
	@if [ "$(docker ps -a | grep $@ | wc -l)" = "1" ]; then \
		docker stop $@ \
		docker rm $@; \
		echo -e "$(GREEN)cleaned$(NC)"; \
	fi
	@if [ "$(DETATCH)" = "true" ]; then \
		docker compose -f ./docker-compose.yml up -d $@; \
	else \
		docker compose -f ./docker-compose.yml up $@; \
	fi
	# @docker compose -f ./docker-compose.yml up $@

stop_containers:
	clear
	@echo -e "${YELLOW}Stopping existing containers...${NC}"
	# @sudo chmod +x /usr/bin/docker-compose
	@docker compose -f ./docker-compose.yml stop
	@docker ps -qa | xargs -r docker stop
	@docker ps -qa | xargs -r docker rm

down:
	@docker compose -f ./docker-compose.yml down

re: clean prep_dirs
	@clear
	@echo -e "${YELLOW}configurazione server https locale${NC}"
	@chmod +x setup/setup_online_website.sh
	@sudo ./setup/setup_online_website.sh
	@echo -e "${GREEN}configurazione completata${NC}"
	make -C srcs/common_tools/ re
	@docker ps -qa | xargs -r docker stop
	@docker ps -qa | xargs -r docker rm
	@docker compose -f ./docker-compose.yml up --build

prep_dirs:
	@echo -e "${YELLOW}Creating directories...${NC}"
	@mkdir -p ./srcs/common_tools/tools
	@mkdir -p ./srcs/receiver
	# @mkdir -p ./srcs/request_manager
	@mkdir -p ./srcs/trascendence
	@mkdir -p ./srcs/user_manager
	@chmod +x ./srcs/trascendence/init.sh

clean:
	@clear
	make -C srcs/common_tools/ clean
	@if [ "$$(docker ps -a -q | wc -l)" -gt 0 ]; then \
		echo -e "Container Docker trovati, procedo con la pulizia..."; \
		if [ "$$(docker ps -q | wc -l)" -gt 0 ]; then \
			docker compose -f docker-compose.yml stop; \
		else \
			echo -e "${RED}Nessun container attivo da fermare.${NC}"; \
		fi; \
		docker ps -qa | xargs -r docker stop || true; \
		docker ps -qa | xargs -r docker rm || true; \
	else \
		echo -e "${RED}Nessun container Docker trovato, skippo la parte Docker.${NC}"; \
	fi
	# Destroy all directories
	rm -rf /data/wordpress
	@echo -e "${GREEN}pulizia base completata	${NC}"

fclean: clean
	@if [ "$$(docker ps -a -q | wc -l)" -gt 0 ] || [ "$$(docker images -q | wc -l)" -gt 0 ] || [ "$$(docker volume ls -q | wc -l)" -gt 0 ]; then \
		echo -e "Risorse Docker trovate, avvio la pulizia profonda..."; \
		docker compose down -v --remove-orphans; \
		docker system prune -a --volumes -f; \
		docker images -qa | xargs -r docker rmi -f || true; \
		docker volume ls -q | xargs -r docker volume rm || true; \
	else \
		echo -e "${RED}Nessuna risorsa Docker trovata, skippo la pulizia.${NC}"; \
	fi
	@echo -e "${GREEN}pulizia completata${NC}"

clean_imgs:
	@docker images -qa | xargs -r docker rmi -f

.PHONY: all stop_containers down re clean remove_all