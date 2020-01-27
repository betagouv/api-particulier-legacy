required-dependency =                                               \
	$(eval COMMAND := which '$(1)')                                 \
	if ! $(COMMAND) >/dev/null; then                                 \
		echo "You must install '$(2)' before you could continue." ; \
		exit 1;                                                     \
	fi

all: update-submodules configure

start:
	@$(call required-dependency,vagrant,Vagrant)
	vagrant up

start-monitoring:
	@$(call required-dependency,vagrant,Vagrant)
	vagrant up monitoring

prepare: ansible_modules/ansible-letsencrypt/README.md ansible_modules/ansible-role-nodejs/README.md
	@$(call required-dependency,ansible,Ansible)
	ansible-galaxy install -r requirements.yml

configure: prepare start start-monitoring
	ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i inventories/development configure.yml --ask-become-pass

update-submodules:
	git submodule foreach git fetch
	git submodule foreach git pull origin master
	git submodule foreach git checkout master

nuke:
	vagrant destroy -f

.PHONY: update-submodules