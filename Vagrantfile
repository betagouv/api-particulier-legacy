# -*- mode: ruby -*-
# vi: set ft=ruby :

vms = {
  :gateway =>
    {
      :ip => '192.168.56.25',
      :alternate_ips => [],
      :memory => '1024',
      :autostart => true,
      :name => 'gateway-development',
      :forwarded_ports => [],
      :synced_folders =>
        [
          {:host => "./api-particulier-auth", :guest => "/opt/apps/api-particulier-auth/current"},
          {:host => "./kong-delegateAuth", :guest => "/root/kong-delegateAuth-master"},
        ],
      :services_to_start =>
        [
          "api-particulier-auth"
        ]
    },
  :app =>
    {
      :ip => '192.168.56.35',
      :alternate_ips => [
        '192.168.56.36',
        '192.168.56.37',
        '192.168.56.38',
      ],
      :autostart => true,
      :memory => '1024',
      :name => 'app-development',
      :forwarded_ports => [],
      :synced_folders =>
        [
          {:host => "./api-particulier", :guest => "/opt/apps/api-particulier/current"},
          {:host => "./svair-mock", :guest => "/opt/apps/svair-mock/current"},
        ],
      :services_to_start =>
        [
          "api-particulier",
          "svair-mock"
        ]
    },
  :monitoring =>
    {
      :ip => '192.168.56.27',
      :alternate_ips => [],
      :autostart => false,
      :memory => '4096',
      :name => 'monitoring-development',
      :forwarded_ports => [],
      :synced_folders =>
        [
          {:host => "./api-stats-elk", :guest => "/opt/apps/api-stats-elk/current"},
        ],
      :services_to_start =>
        [
          "api-stats-elk"
        ]
    }
}

ssh_pubkey = File.read(File.join(Dir.home, '.ssh', 'id_rsa.pub')).chomp

Vagrant.configure("2") do |config|
  config.vm.box = "bento/ubuntu-16.04"
  config.vm.synced_folder ".", "/vagrant", disabled: true

  config.vm.provision 'shell', inline: <<-SHELL
    sudo mkdir -p /home/vagrant/.ssh -m 700
    sudo echo '#{ssh_pubkey}' >> /home/vagrant/.ssh/authorized_keys
  SHELL

  # see https://github.com/hashicorp/vagrant/issues/9222
  config.vm.provision 'shell', run: 'always', inline: <<-SHELL
    sudo sed -i '/^auto enp0s3/c\#auto enp0s3/' /etc/network/interfaces
    sudo sed -i '/^iface enp0s3 inet dhcp/c\#iface enp0s3 inet dhcp/' /etc/network/interfaces
    sudo sed -i '/^pre-up sleep 2/c\#pre-up sleep 2/' /etc/network/interfaces
  SHELL

  config.ssh.insert_key = false

  config.vm.provider "virtualbox" do |v|
    v.cpus = 1
    v.gui = false
  end

  vms.each_pair do |key, vm|
    autostart = vm[:autostart]
    config.vm.define key, autostart: autostart do |configvm|

      configvm.vm.network 'private_network', ip: vm[:ip]

      vm[:alternate_ips].each do |ip|
        configvm.vm.network 'private_network', ip: ip, auto_config: false
      end

      vm[:forwarded_ports].each do |port|
        configvm.vm.network :forwarded_port, guest: port[:guest], host: port[:host]
      end

      configvm.vm.provider 'virtualbox' do |vb|
        vb.memory = vm[:memory] || '512'
        vb.name = vm[:name]
      end

      vm[:synced_folders].each do |folders|
        configvm.vm.synced_folder folders[:host], folders[:guest], type: "nfs", create: true
      end

      # We need to start the services here as the first start failed because it
      # was triggered before the shared folder are mounted
      vm[:services_to_start].each do |service|
        configvm.trigger.after :up do |trigger|
          trigger.info = "Starting #{service}..."
          # this command will fail on first installation since the service is not configured yet
          # we ignore error for smoother installation
          trigger.run_remote = {inline: "sudo systemctl start #{service} || echo 'if it is your first installation ignore the error above'"}
        end
      end
    end
  end
end
