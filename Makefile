CONTAINERS = tokenizer receiver postgres request_manager auth user_manager history_manager chat game_data_manager matchmaking

# ========================================= #
SHELL := /bin/bash

RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[0;33m
BLUE = \033[0;34m
NC = \033[0m

# Funzione per loggare il tempo
define log_time
	@echo -e "$(YELLOW)$1 at $$(date +%T)$(NC)"
endef

all: prep_dirs
	@clear
	$(call log_time, Rimozione del volume per evitare conflitti...)
	# @sudo docker volume rm ct;
	$(call log_time, Configurazione server https locale)
	@chmod +x setup/setup_online_website.sh
	@sudo ./setup/setup_online_website.sh
	$(call log_time, Configurazione completata)
	make -C ./srcs/common_tools/ all
	$(call log_time, Avvio container Docker...)
	if [ "$${DETATCH}" = "true" ]; then \
		sudo docker-compose -f ./docker-compose.yml up -d; \
	else \
		sudo docker-compose -f ./docker-compose.yml up; \
	fi

$(CONTAINERS): prep_dirs
	@clear
	@if [ "$$(docker ps -a | grep $@ | wc -l)" -gt 0 ]; then \
		echo -e "$(YELLOW)Container $@ già esistente, fermo e rimuovo...$(NC)"; \
		sudo docker stop $@ || true; \
		sudo docker rm $@ || true; \
		echo -e "$(GREEN)$@ rimosso correttamente$(NC)"; \
	fi
	$(call log_time, Pulizia immagini inutilizzate...)
	@sudo docker system prune -f > /dev/null || true
	$(call log_time, Avvio container $@...)
	if [ "$${DETATCH}" = "true" ]; then \
		sudo docker-compose -f ./docker-compose.yml up -d $@; \
	else \
		sudo docker-compose -f ./docker-compose.yml up $@; \
	fi

stop_containers:
	clear
	$(call log_time, Stopping existing containers...)
	@sudo chmod +x /usr/bin/docker-compose
	@sudo docker-compose -f ./docker-compose.yml stop
	@sudo docker ps -qa | xargs -r docker stop
	@sudo docker ps -qa | xargs -r docker rm

down:
	@sudo docker-compose -f ./docker-compose.yml down

re: clean prep_dirs
	@clear
	$(call log_time, Configurazione server https locale)
	@chmod +x setup/setup_online_website.sh
	@sudo ./setup/setup_online_website.sh
	$(call log_time, Configurazione completata)
	make -C srcs/common_tools/ re
	@sudo docker ps -qa | xargs -r docker stop
	@sudo docker ps -qa | xargs -r docker rm
	@sudo docker-compose -f ./docker-compose.yml up --build

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
			sudo docker-compose -f docker-compose.yml stop; \
		else \
			echo -e "${RED}Nessun container attivo da fermare.${NC}"; \
		fi; \
		docker ps -qa | xargs -r docker stop || true; \
		docker ps -qa | xargs -r docker rm || true; \
	else \
		echo -e "${RED}Nessun container Docker trovato, skippo la parte Docker.${NC}"; \
	fi
	$(call log_time, Pulizia base completata)

fclean: clean
	rm -fr ./*/*/.bundle
	@if [ "$$(docker ps -a -q | wc -l)" -gt 0 ] || [ "$$(docker images -q | wc -l)" -gt 0 ] || [ "$$(docker volume ls -q | wc -l)" -gt 0 ]; then \
		echo -e "Risorse Docker trovate, avvio la pulizia profonda..."; \
		sudo docker-compose down -v --remove-orphans; \
		sudo docker system prune -a --volumes -f; \
		sudo docker images -qa | xargs -r docker rmi -f || true; \
		sudo docker volume ls -q | xargs -r docker volume rm || true; \
	else \
		echo -e "${RED}Nessuna risorsa Docker trovata, skippo la pulizia.${NC}"; \
	fi
	$(call log_time, Pulizia completata)

clean_imgs:
	@sudo docker images -qa | xargs -r docker rmi -f

.PHONY: all stop_containers down re clean remove_all fclean
 