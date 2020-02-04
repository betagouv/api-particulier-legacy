required-dependency =                                               \
	$(eval COMMAND := which '$(1)')                                 \
	if ! $(COMMAND) >/dev/null; then                                 \
		echo "You must install '$(2)' before you could continue." ; \
		exit 1;                                                     \
	fi

help:
	@echo "                          ====================================================================="
	@echo "                          API Particulier"
	@echo "                          ====================================================================="
	@echo "                    help: Shows API Particulier Help Menu: type: make help"
	@echo "                  deploy: Deploys one of the applications on the requested environment"
	@echo "               provision: Provisions the requested environment"
	@echo "                          ====================================================================="
	@echo "                 install: Installs and deploys locally API Particulier"
	@echo "                   start: Starts development vagrant machines"
	@echo "        start-monitoring: Starts monitoring vagrant machine"
	@echo "         provision-local: Provisions local vagrant machines"
	@echo "            deploy-local: Deploys all the applications on the local environment"
	@echo "                    nuke: Destroys local vagrant machines"
	@echo ""

all: help

start:
	@$(call required-dependency,vagrant,Vagrant)
	vagrant up

start-monitoring:
	@$(call required-dependency,vagrant,Vagrant)
	vagrant up monitoring

.prepare:
	@$(call required-dependency,ansible,Ansible)
	ansible-galaxy install -r requirements.yml

provision-local: .prepare start start-monitoring
	ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i inventories/development configure.yml --ask-become-pass

provision:
	@read -p "Which environment do you want to provision? " TARGET_ENVIRONMENT; \
	read -p "Are you sure you want to provision $$TARGET_ENVIRONMENT?[yN] " YESNO; \
	if [ $$YESNO != "y" ]; then \
		echo "Provisioning cancelled."; \
		exit 0; \
	fi; \
	ansible-playbook -i ../api-particulier-ansible-secrets/inventories/$$TARGET_ENVIRONMENT configure.yml --vault-password-file ~/.ssh/ansible_vault --ask-become-pass;

deploy-local:
	ansible-playbook -i inventories/development deploy.yml

deploy:
	@read -p "Which application do you want to deploy? " APPLICATION_TO_DEPLOY; \
	read -p "On which environment do you want to deploy $$APPLICATION_TO_DEPLOY? " TARGET_ENVIRONMENT; \
	if [ $$TARGET_ENVIRONMENT = "production" ]; then \
		read -p "Are you sure you want to deploy to production?[yN] " YESNO; \
		if [ $$YESNO != "y" ]; then \
			echo "Deployment cancelled."; \
			exit 0; \
		fi \
	fi; \
	ansible-playbook -i ../api-particulier-ansible-secrets/inventories/$$TARGET_ENVIRONMENT deploy.yml -t $$APPLICATION_TO_DEPLOY --vault-password-file ~/.ssh/ansible_vault;

install: provision-local deploy-local

nuke:
	vagrant destroy -f
