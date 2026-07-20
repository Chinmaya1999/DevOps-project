class AnsibleGenerator {
  static generate(config) {
    const {
      playbookName,
      targetHosts,
      become = true,
      tasks
    } = config;

    let playbook = `---
- name: ${playbookName}
  hosts: ${targetHosts.join(', ')}
  become: ${become}
  vars:
    ansible_ssh_private_key_file: ~/.ssh/id_rsa
    ansible_user: ubuntu
    ansible_ssh_common_args: '-o StrictHostKeyChecking=no'
  
  tasks:`;

    tasks.forEach((task, index) => {
      const { name, module, parameters = {} } = task;
      
      playbook += `
    - name: ${name}
      ${module}:`;
      
      Object.entries(parameters).forEach(([key, value]) => {
        if (typeof value === 'string') {
          playbook += `\n        ${key}: "${value}"`;
        } else if (typeof value === 'object' && value !== null) {
          playbook += `\n        ${key}:`;
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (typeof subValue === 'string') {
              playbook += `\n          ${subKey}: "${subValue}"`;
            } else {
              playbook += `\n          ${subKey}: ${subValue}`;
            }
          });
        } else {
          playbook += `\n        ${key}: ${value}`;
        }
      });
    });

    playbook += `
  
  handlers:
    - name: restart nginx
      service:
        name: nginx
        state: restarted
        
    - name: restart apache2
      service:
        name: apache2
        state: restarted

  post_tasks:
    - name: Display completion message
      debug:
        msg: "Playbook '${playbookName}' completed successfully!"
`;

    return playbook;
  }

  static generateInventory(hosts) {
    let inventory = `[webservers]
`;
    hosts.forEach((host, index) => {
      inventory += `${host} ansible_host=${host} ansible_user=ubuntu\n`;
    });

    inventory += `
[database]
db-server ansible_host=your-db-server ansible_user=ubuntu

[all:vars]
ansible_python_interpreter=/usr/bin/python3
ansible_ssh_private_key_file=~/.ssh/id_rsa
`;

    return inventory;
  }

  static generateRolesDirectory() {
    return `# Ansible Roles Structure
# 
# Create the following directory structure:
# roles/
# ├── common/
# │   ├── tasks/
# │   │   └── main.yml
# │   ├── handlers/
# │   │   └── main.yml
# │   ├── templates/
# │   ├── files/
# │   ├── vars/
# │   │   └── main.yml
# │   ├── defaults/
# │   │   └── main.yml
# │   └── meta/
# │       └── main.yml
# ├── webserver/
# └── database/

# Example role task file (roles/common/tasks/main.yml):
# ---
# - name: Update apt cache
#   apt:
#     update_cache: yes
#     cache_valid_time: 3600
# 
# - name: Install common packages
#   apt:
#     name:
#       - vim
#       - curl
#       - wget
#       - git
#     state: present
`;
  }
}

module.exports = AnsibleGenerator;
