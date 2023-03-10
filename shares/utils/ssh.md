Execute ssh command on a remote host

```yaml
  - scene:
      path: https://raw.githubusercontent.com/circle2jt/ymlr/dev/shares/utils/ssh.yaml
      vars:
        key: ~/.ssh/id_rsa
        address: root@192.168.11.112
        result: ${ $vars.sceneResult }
        script: |
          # Print hello world to console
          echo "Hello world"

          echo "Done"
    vars: sshLog

  - echo: ${ $vars.sshLog }
```