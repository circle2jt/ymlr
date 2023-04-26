# Changes logs

## History

- [1.1.11-alpha.2.md](#1682492077755)  -  _4/26/2023, 1:54:37 PM_
- [1.1.11-alpha.0.md](#1681997869191)  -  _4/20/2023, 8:37:49 PM_
- [1.1.10.md](#1681979885096)  -  _4/20/2023, 3:38:05 PM_
- [1.1.10-alpha.0.md](#1681410959143)  -  _4/14/2023, 1:35:59 AM_
- [1.1.9.md](#1681381769752)  -  _4/13/2023, 5:29:29 PM_
- [1.1.8.md](#1681199796693)  -  _4/11/2023, 2:56:36 PM_
- [1.1.6.md](#1680948908095)  -  _4/8/2023, 5:15:08 PM_
- [1.1.5.md](#1680250469475)  -  _3/31/2023, 3:14:29 PM_
- [1.1.4.md](#1678460526324)  -  _3/10/2023, 10:02:06 PM_
- [1.1.3.md](#1678441053863)  -  _3/10/2023, 4:37:33 PM_
- [1.1.2.md](#1677756809559)  -  _3/2/2023, 6:33:29 PM_
- [1.1.1.md](#1677582060163)  -  _2/28/2023, 6:01:00 PM_
- [1.1.1-alpha.3.md](#1677496853425)  -  _2/27/2023, 6:20:53 PM_
- [1.1.0.md](#1676887754962)  -  _2/20/2023, 5:09:14 PM_
- [1.0.0.md](#1676438730395)  -  _2/15/2023, 12:25:30 PM_
- [0.0.1.md](#1676125376876)  -  _2/11/2023, 9:22:56 PM_
- [0.0.1-alpha.13.md](#1676123019213)  -  _2/11/2023, 8:43:39 PM_

## Details

<a id="1682492077755"></a>
### 1.1.11-alpha.2

* refactor: Update log debug format (af30714)
  
<a id="1681997869191"></a>
### 1.1.11-alpha.0

* fix: path in scene not replace by expression (fb27533)
  
<a id="1681979885096"></a>
### 1.1.10

* feat: add "js", "sh" tags (4172b26)
* test: add new test to test async task in http'job (d0655ce)
* fix(upgrade): not save new version in package.json when upgrade packages (432e8c3)
* chore: prerelease 1.1.10-alpha.0 (ec3f1e9)
* fix(scene'process): could not pass circle refs global vars (68b12b2)
* feat(scene'process): allow clone template (6322819)
  
<a id="1681410959143"></a>
### 1.1.10-alpha.0

* fix(scene'process): could not pass circle refs global vars (68b12b2)
* feat(scene'process): allow clone template (6322819)
  
<a id="1681381769752"></a>
### 1.1.9

* fix(scene): scope is not working (328e936)
* fix(scene-process): not share variable (baf7d05)
  
<a id="1681199796693"></a>
### 1.1.8

* feat: Support pass multiple env-files (235f55d)
* fix: ymlr cli could not executed (d0475e5)
* refactor: Replace pnpm to yarn (920326c)
  
<a id="1680948908095"></a>
### 1.1.6

* feat: add "id" props to ref to elementProxy (ee9bbec)
* feat: allow change default package manager priority (d05741a)
* ci: fix pnpm new version is error (406509e)
  
<a id="1680250469475"></a>
### 1.1.5

* feat: add YAML type "!regex" (5267a70)
* feat: support preScript, postScript in proxy (a17dc2c)
* fix(ssh.yaml): tput: No value for $TERM and no -T specified (f32ca79)
  
<a id="1678460526324"></a>
### 1.1.4

* feat: add new tag scene'returns (24a7640)
* doc(share/ssh): show log debug (b2b2d94)
  
<a id="1678441053863"></a>
### 1.1.3

* doc: add a new utils scene to connect to ssh (640b4aa)
* feat: auto pass $parentState from parent (2edf64f)
* feat(exec'sh): Support timeout and exec in a new process (bb23ccf)
* feat: Handle on app exit event, event global (96e1b4b)
  
<a id="1677756809559"></a>
### 1.1.2

* doc: share a scene to upload a file to tmpfiles server (81a8d5a)
* refactor: Replace fetch to axios (50777ac)
* refactor(http): Replace fetch native to node-fetch (0ffb512)
* fix(scene): Allow pass string in scene'process (e525a64)
* fix(docker): Update example scene (0345c3c)
  
<a id="1677582060163"></a>
### 1.1.1

* refactor(echo)!: Remove quick print color tag (bd6102e)
* refactor: replace yaml to js-yaml libs (97a5397)
* fix(scene): $parentState miss & pass input string (7b40db6)
* chore: prerelease 1.1.1-alpha.3 (87e2b93)
* feat(scene): separate scene to scene-process (01025e0)
* feat(scene): add "scope" in scene (4ce6bfc)
* fix(debug): debug is not overrided (d69750e)
* fix(FileTemp): replace to sync create function (6d4e592)
* fix(scene): pass env, tagDirs to new process (5e4c90f)
* feat: support run a scene as a child process (b1b968b)
  
<a id="1677496853425"></a>
### 1.1.1-alpha.3

* feat(scene): separate scene to scene-process (01025e0)
* feat(scene): add "scope" in scene (4ce6bfc)
* fix(debug): debug is not overrided (d69750e)
* fix(FileTemp): replace to sync create function (6d4e592)
* fix(scene): pass env, tagDirs to new process (5e4c90f)
* feat: support run a scene as a child process (b1b968b)
  
<a id="1676887754962"></a>
### 1.1.0

* refactor!: change "vars", "utils", "parentState"... (4642674)
* refactor: remove inject default properties in element (e75528b)
* feat!: separate element proxy (95acbb9)
  
<a id="1676438730395"></a>
### 1.0.0

* refactor!: Change to new tag format (1ed8f03)
* fix: throw error when validate version failed (d05ddd3)
* fix: support code to exit (20e70ff)
* refactor: script to create a release for sharing (68da0ba)
* refactor: script to create tag for sharing (41cee43)
* refactor: script to update version for sharing (b3850db)
* chore: patch 0.0.1 (1636704)
* Merge branch 'dev' (ab22008)
* chore: prerelease 0.0.1-alpha.13 (7d22e20)
* ci: auto create tag and release base on version (8d156c0)
* ci: separate tags depends on branch name (103e1b1)
* fix: npm tag is empty when publish to registry (ffa7285)
* chore: prerelease v0.0.1-alpha.3 (11995bf)
* build: auto replace tag in the building progress (f40db2d)
* chore: add script to auto increase npm version (c2a1669)
* doc: replace "log" to "debug" (1ba5a30)
* refactor: replace "log" to "debug" (a1dbd28)
* build: remove unused github.workflows (891cdc7)
* build: apply env to github into project (04df927)
* build: Support alpine and debian images (d626bed)
* Initial commit (97d5e52)
  
<a id="1676125376876"></a>
### 0.0.1

* Merge branch 'dev' (ab2200856bc59e68899297fbf7a5bb6e0402dfd3)
* chore: prerelease 0.0.1-alpha.13 (7d22e20521f0bf745de0264b3b820280f7748fec)
* ci: auto create tag and release base on version (8d156c09755607e10fd7ef679c8a5564c27eed47)
* ci: separate tags depends on branch name (103e1b144dd6cc81462e23955f8c0c64e519a31d)
* fix: npm tag is empty when publish to registry (ffa7285e1a68f12ac73ec6b4e17a36766b3dbc6a)
* chore: prerelease v0.0.1-alpha.3 (11995bfa0799abbacc5b4ab9d3849c06bdd8eb38)
* build: auto replace tag in the building progress (f40db2daf1c44ae31dbca68ec5ca7f9d9ee9b9e5)
* chore: add script to auto increase npm version (c2a1669986ae989ba06563d8ad1e554257634b7c)
* doc: replace "log" to "debug" (1ba5a302befa2624de8abd05de9bbdfae35ea633)
* refactor: replace "log" to "debug" (a1dbd28896046e8dfe7938e167d2f6fbfe3fda32)
* build: remove unused github.workflows (891cdc7dabaf2b06c7b4c42572abba9a39f599b9)
* build: apply env to github into project (04df92759f5df65c28a3e3470f82562c4093cd57)
* build: Support alpine and debian images (d626bedd57bd43f7647a42e9d14f5472a8c2f85a)
* Initial commit (97d5e5234898e6777d21ee378be231ecd93af17c)
  
<a id="1676123019213"></a>
### 0.0.1-alpha.13

* ci: auto create tag and release base on version (8d156c09755607e10fd7ef679c8a5564c27eed47)
* ci: separate tags depends on branch name (103e1b144dd6cc81462e23955f8c0c64e519a31d)

