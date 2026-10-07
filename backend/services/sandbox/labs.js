/**
 * Guided labs for the Linux / DevOps sandbox.
 *
 * Each lab runs INSIDE the user's own throw-away container, as the unprivileged `learner` user:
 *   setup     shell snippet that prepares the scenario (runs once, when the lab starts)
 *   check     shell snippet that validates the RESULT (exit 0 = pass). Checks look at the end state, not at the
 *             commands typed, so any valid approach passes.
 *   solution  reference answer. NEVER sent to the browser; only tests/sandboxLabs.test.js uses it to prove every lab
 *             fails before the fix and passes after it.
 *   requires  tools the lab needs ('py:yaml' = python3 yaml module) so the test can skip what the host lacks
 *
 * Shell snippets avoid JS-template interpolation: D is a literal "$" for the few places that need `$` + `{`.
 */
const D = '$';
const ANS = String.raw`ans() { tr -d '\r' < "$HOME/answer.txt" | sed 's/[[:space:]]*$//'; }`;

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const XP = { beginner: 10, intermediate: 20, advanced: 30 };

const lab = (def) => Object.freeze({ xp: XP[def.level], requires: [], ...def });

const LABS = [
  // ───────────────────────────── Beginner ─────────────────────────────
  lab({
    id: 'nav-basics', level: 'beginner', category: 'linux', minutes: 5,
    title: 'Find the hidden token',
    goal: 'Move around the filesystem and read a hidden file.',
    tasks: ['Somewhere under ~/lab/projects there is a hidden file called .token.', 'Find it and copy its contents into ~/answer.txt.'],
    concepts: ['ls -a', 'cd', 'find', 'cat', 'redirection (>)'],
    hints: ['Hidden files start with a dot. `ls -a` shows them.', 'You can search a whole tree with `find ~/lab/projects -name .token`.', 'Send the output into a file: `cat <path> > ~/answer.txt`.'],
    setup: String.raw`mkdir -p ~/lab/projects/web/css ~/lab/projects/api/src ~/lab/projects/docs
echo "ALPHA-7421" > ~/lab/projects/web/css/.token
echo "decoy" > ~/lab/projects/api/src/token.txt`,
    check: `${ANS}\n[ "$(ans)" = "ALPHA-7421" ]`,
    solution: 'cat ~/lab/projects/web/css/.token > ~/answer.txt',
  }),
  lab({
    id: 'file-ops', level: 'beginner', category: 'linux', minutes: 6,
    title: 'Copy, move and rename files',
    goal: 'Create directories and copy / rename files safely.',
    tasks: ['Create the directory ~/backup.', 'COPY every .conf file from ~/lab/etc into ~/backup (the originals must stay; do not copy c.txt).', 'Rename ~/backup/a.conf to a.conf.bak.'],
    concepts: ['mkdir', 'cp', 'mv', 'globbing (*.conf)'],
    hints: ['`mkdir ~/backup` creates it.', '`cp ~/lab/etc/*.conf ~/backup/` copies all .conf files at once.', '`mv` renames: `mv ~/backup/a.conf ~/backup/a.conf.bak`.'],
    setup: String.raw`mkdir -p ~/lab/etc
echo "a" > ~/lab/etc/a.conf; echo "b" > ~/lab/etc/b.conf; echo "c" > ~/lab/etc/c.txt`,
    check: String.raw`cd ~ && [ -f backup/b.conf ] && [ -f backup/a.conf.bak ] && [ ! -e backup/a.conf ] && [ ! -e backup/c.txt ] && [ -f lab/etc/a.conf ] && [ -f lab/etc/b.conf ]`,
    solution: String.raw`mkdir ~/backup && cp ~/lab/etc/*.conf ~/backup/ && mv ~/backup/a.conf ~/backup/a.conf.bak`,
  }),
  lab({
    id: 'grep-logs', level: 'beginner', category: 'linux', minutes: 5,
    title: 'Count the errors in a log',
    goal: 'Search text with grep.',
    tasks: ['~/lab/app.log has 200 lines of INFO, WARN and ERROR messages.', 'Count how many lines contain ERROR and write just that number to ~/answer.txt.'],
    concepts: ['grep', 'grep -c', 'wc -l', 'pipes'],
    hints: ['`grep ERROR ~/lab/app.log` prints matching lines.', '`grep -c` counts them instead of printing them.', '`grep -c ERROR ~/lab/app.log > ~/answer.txt`'],
    setup: String.raw`mkdir -p ~/lab
awk 'BEGIN{for(i=1;i<=200;i++){ if(i%7==0) l="ERROR"; else if(i%5==0) l="WARN"; else l="INFO"; printf "2024-05-01 10:%02d:%02d %s service request %d handled\n", i/60, i%60, l, i}}' > ~/lab/app.log`,
    check: `${ANS}\n[ "$(ans)" = "28" ]`,
    solution: 'grep -c ERROR ~/lab/app.log > ~/answer.txt',
  }),
  lab({
    id: 'pipes-top-ip', level: 'beginner', category: 'linux', minutes: 8,
    title: 'Who is hammering the server?',
    goal: 'Chain commands with pipes to summarise a web access log.',
    tasks: ['~/lab/access.log is a web server log; the first column is the client IP.', 'Find the IP address with the most requests and write only the IP to ~/answer.txt.'],
    concepts: ['awk / cut', 'sort', 'uniq -c', 'head', 'pipes'],
    hints: ['Extract the first column: `awk \'{print $1}\' ~/lab/access.log`.', 'Count duplicates with `sort | uniq -c`, then sort numerically in reverse: `sort -rn`.', '`... | head -1` gives the top line; use awk again to print only the IP.'],
    setup: String.raw`mkdir -p ~/lab
awk 'BEGIN{for(i=1;i<=120;i++){ if(i%2==0) ip="10.0.0.5"; else if(i%3==0) ip="10.0.0.9"; else ip="10.0.0.12"; printf "%s - - [01/May/2024:10:00:%02d] \"GET /page%d HTTP/1.1\" 200 512\n", ip, i%60, i}}' > ~/lab/access.log`,
    check: `${ANS}\n[ "$(ans)" = "10.0.0.5" ]`,
    solution: String.raw`awk '{print $1}' ~/lab/access.log | sort | uniq -c | sort -rn | head -1 | awk '{print $2}' > ~/answer.txt`,
  }),
  lab({
    id: 'permissions-basic', level: 'beginner', category: 'linux', minutes: 6,
    title: 'Fix file permissions',
    goal: 'Read and change Unix permissions with chmod.',
    tasks: ['Make ~/lab/deploy.sh executable by its owner.', 'Make ~/lab/secret.key readable and writable by the owner ONLY (no access for group or others).'],
    concepts: ['ls -l', 'chmod u+x', 'chmod 600', 'octal modes'],
    hints: ['`ls -l ~/lab` shows the current permissions.', '`chmod u+x ~/lab/deploy.sh` adds execute for the owner.', '600 means rw------- : `chmod 600 ~/lab/secret.key`.'],
    setup: String.raw`mkdir -p ~/lab
printf '#!/bin/bash\necho deployed\n' > ~/lab/deploy.sh; chmod 644 ~/lab/deploy.sh
echo "PRIVATE" > ~/lab/secret.key; chmod 644 ~/lab/secret.key`,
    check: String.raw`[ -x ~/lab/deploy.sh ] && [ "$(ls -l ~/lab/secret.key | cut -c1-10)" = "-rw-------" ]`,
    solution: 'chmod u+x ~/lab/deploy.sh; chmod 600 ~/lab/secret.key',
  }),
  lab({
    id: 'find-delete', level: 'beginner', category: 'linux', minutes: 6,
    title: 'Clean up temp files',
    goal: 'Use find to locate and delete files by pattern.',
    tasks: ['~/lab/cache contains nested directories full of *.tmp files and a few files you must keep (*.keep, *.dat).', 'Delete every *.tmp file, everywhere under ~/lab/cache, without touching the others.'],
    concepts: ['find -name', 'find -delete', '-exec rm'],
    hints: ['`find ~/lab/cache -name "*.tmp"` lists them first — always look before you delete.', 'Add `-delete` at the end to remove what was matched.', '`find ~/lab/cache -name "*.tmp" -delete`'],
    setup: String.raw`mkdir -p ~/lab/cache/a/b ~/lab/cache/c
for f in ~/lab/cache/x.tmp ~/lab/cache/a/y.tmp ~/lab/cache/a/b/z.tmp ~/lab/cache/c/w.tmp; do echo t > $f; done
echo k > ~/lab/cache/a/important.keep; echo k > ~/lab/cache/c/data.dat`,
    check: String.raw`[ -z "$(find ~/lab/cache -name '*.tmp')" ] && [ -f ~/lab/cache/a/important.keep ] && [ -f ~/lab/cache/c/data.dat ]`,
    solution: String.raw`find ~/lab/cache -name '*.tmp' -delete`,
  }),
  lab({
    id: 'csv-awk', level: 'beginner', category: 'linux', minutes: 8,
    title: 'Filter a CSV',
    goal: 'Pull columns out of structured text.',
    tasks: ['~/lab/users.csv has the columns name,role.', 'Write the names of all users whose role is admin to ~/answer.txt, one per line, sorted alphabetically.'],
    concepts: ['awk -F,', 'cut -d,', 'sort'],
    hints: ['`cut -d, -f1,2` splits on commas. awk does the same with `-F,`.', '`awk -F, \'$2=="admin" {print $1}\' file` prints names of admins.', 'Pipe into `sort` and redirect to ~/answer.txt.'],
    setup: String.raw`mkdir -p ~/lab
printf 'name,role\nerin,admin\nbob,dev\nalice,admin\ndave,ops\ncarol,admin\n' > ~/lab/users.csv`,
    check: String.raw`[ "$(tr -d '\r' < ~/answer.txt)" = "$(printf 'alice\ncarol\nerin')" ]`,
    solution: String.raw`awk -F, '$2=="admin"{print $1}' ~/lab/users.csv | sort > ~/answer.txt`,
  }),
  lab({
    id: 'tar-archive', level: 'beginner', category: 'linux', minutes: 7,
    title: 'Back up a site with tar',
    goal: 'Create and extract compressed archives.',
    tasks: ['Create ~/lab/site.tar.gz containing the whole ~/lab/site directory.', 'Extract that archive into a new directory ~/lab/restore.'],
    concepts: ['tar -czf', 'tar -xzf', 'tar -tzf', '-C'],
    hints: ['c = create, z = gzip, f = file: `tar -czf archive.tar.gz folder`.', 'Run it from ~/lab so paths inside the archive start with `site/`.', 'Extract into a directory with `-C`: `mkdir ~/lab/restore && tar -xzf ~/lab/site.tar.gz -C ~/lab/restore`.'],
    setup: String.raw`mkdir -p ~/lab/site/css
echo "<h1>Hello</h1>" > ~/lab/site/index.html; echo "body{}" > ~/lab/site/css/style.css`,
    check: String.raw`tar -tzf ~/lab/site.tar.gz | grep -q 'site/index.html' && tar -tzf ~/lab/site.tar.gz | grep -q 'site/css/style.css' && [ -f ~/lab/restore/site/index.html ]`,
    solution: String.raw`cd ~/lab && tar -czf site.tar.gz site && mkdir restore && tar -xzf site.tar.gz -C restore`,
  }),
  lab({
    id: 'env-vars', level: 'beginner', category: 'linux', minutes: 8,
    title: 'A script that reads an environment variable',
    goal: 'Use environment variables and default values in a shell script.',
    tasks: ['Create ~/lab/greet.sh.', 'With NAME=DevOps it must print "Hello, DevOps!"; with NAME unset it must print "Hello, World!".'],
    concepts: ['environment variables', '$NAME', 'default values', 'shebang'],
    hints: ['Start the file with `#!/bin/bash`, then use echo.', 'Inside double quotes, `$NAME` expands to the variable.', `A default value looks like ${D}{NAME:-World}.`],
    setup: 'mkdir -p ~/lab',
    check: String.raw`[ "$(NAME=DevOps bash ~/lab/greet.sh)" = "Hello, DevOps!" ] && [ "$(env -u NAME bash ~/lab/greet.sh)" = "Hello, World!" ]`,
    solution: `printf '#!/bin/bash\\necho "Hello, ${D}{NAME:-World}!"\\n' > ~/lab/greet.sh`,
  }),
  lab({
    id: 'shell-sum', level: 'beginner', category: 'linux', minutes: 8,
    title: 'Write your first script',
    goal: 'Take arguments in a bash script and do arithmetic.',
    tasks: ['Create ~/lab/sum.sh. `bash ~/lab/sum.sh 3 4` must print 7, and `bash ~/lab/sum.sh 10 5` must print 15.'],
    concepts: ['$1 $2', 'arithmetic $(( ))', 'echo'],
    hints: ['Script arguments are $1, $2, ...', 'Arithmetic in bash: `$(( $1 + $2 ))`.', 'Put `echo $(( $1 + $2 ))` in the file after the shebang line.'],
    setup: 'mkdir -p ~/lab',
    check: String.raw`[ "$(bash ~/lab/sum.sh 3 4)" = "7" ] && [ "$(bash ~/lab/sum.sh 10 5)" = "15" ]`,
    solution: `printf '#!/bin/bash\\necho ${D}(( ${D}1 + ${D}2 ))\\n' > ~/lab/sum.sh`,
  }),
  lab({
    id: 'symlink-release', level: 'beginner', category: 'linux', minutes: 6,
    title: 'Switch a release with a symlink',
    goal: 'Use symbolic links the way real deployments do.',
    tasks: ['~/lab/current is a symlink to releases/v1.', 'Point it at releases/v2 (keep both release directories).'],
    concepts: ['ln -s', 'ln -sfn', 'readlink', 'atomic deploys'],
    hints: ['`ls -l ~/lab` shows where a symlink points.', 'You cannot just `ln -s` over an existing link — use `-f` (force) and `-n`.', '`cd ~/lab && ln -sfn releases/v2 current`'],
    setup: String.raw`mkdir -p ~/lab/releases/v1 ~/lab/releases/v2
echo v1 > ~/lab/releases/v1/version; echo v2 > ~/lab/releases/v2/version
ln -sfn releases/v1 ~/lab/current`,
    check: String.raw`[ -L ~/lab/current ] && [ "$(cat ~/lab/current/version)" = "v2" ] && [ -d ~/lab/releases/v1 ]`,
    solution: 'cd ~/lab && ln -sfn releases/v2 current',
  }),

  // ───────────────────────────── Intermediate ─────────────────────────────
  lab({
    id: 'sed-edit', level: 'intermediate', category: 'linux', minutes: 8,
    title: 'Change a config value with sed',
    goal: 'Edit files non-interactively, the way automation does.',
    tasks: ['In ~/lab/app.conf change the setting `port=8080` to `port=9090`.', 'Do not touch the comment line that also mentions 8080.'],
    concepts: ['sed -i', 'regex anchors (^)', 'backups (-i.bak)'],
    hints: ['sed substitution: `sed \'s/old/new/\' file`.', 'Anchor to the start of the line with `^` so the comment is not matched.', '`sed -i.bak \'s/^port=8080/port=9090/\' ~/lab/app.conf`'],
    setup: String.raw`mkdir -p ~/lab
printf '# default port=8080 (do not change this comment)\nport=8080\nhost=0.0.0.0\n' > ~/lab/app.conf`,
    check: String.raw`grep -qx 'port=9090' ~/lab/app.conf && grep -qx '# default port=8080 (do not change this comment)' ~/lab/app.conf && grep -qx 'host=0.0.0.0' ~/lab/app.conf`,
    solution: String.raw`sed -i.bak 's/^port=8080/port=9090/' ~/lab/app.conf`,
  }),
  lab({
    id: 'ssh-keygen', level: 'intermediate', category: 'linux', minutes: 5,
    title: 'Generate an SSH key pair',
    goal: 'Create keys for passwordless server access.',
    tasks: ['Generate an ed25519 key pair at the default location (~/.ssh/id_ed25519) with an empty passphrase.', 'The private key must only be readable by you.'],
    concepts: ['ssh-keygen -t ed25519', '~/.ssh', 'key permissions'],
    hints: ['`ssh-keygen -t ed25519` is the command.', 'Use `-N ""` for no passphrase and `-f` for the path.', '`ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519`'],
    requires: ['ssh-keygen'],
    setup: 'mkdir -p ~/lab',
    check: String.raw`[ -f ~/.ssh/id_ed25519 ] && [ -f ~/.ssh/id_ed25519.pub ] && grep -q '^ssh-ed25519 ' ~/.ssh/id_ed25519.pub && [ "$(ls -l ~/.ssh/id_ed25519 | cut -c1-10)" = "-rw-------" ]`,
    solution: String.raw`mkdir -p ~/.ssh && ssh-keygen -q -t ed25519 -N '' -f ~/.ssh/id_ed25519`,
  }),
  lab({
    id: 'git-branch', level: 'intermediate', category: 'git', minutes: 8,
    title: 'Branch and commit',
    goal: 'Use a feature branch without touching main.',
    tasks: ['~/lab/repo is a git repository with a new untracked file login.txt.', 'Create a branch named feature/login and commit login.txt on it with a message mentioning "login".', 'The main branch must NOT contain login.txt.'],
    concepts: ['git switch -c', 'git add', 'git commit', 'git log'],
    hints: ['`git status` shows what is untracked.', '`git switch -c feature/login` creates and moves to the branch.', '`git add login.txt && git commit -m "add login"`'],
    requires: ['git'],
    setup: String.raw`git config --global user.email learner@example.com; git config --global user.name Learner; git config --global init.defaultBranch main
mkdir -p ~/lab/repo && cd ~/lab/repo && git init -q && echo "v1" > app.txt && git add app.txt && git commit -qm "initial commit"
echo "login page" > login.txt`,
    check: String.raw`cd ~/lab/repo && git rev-parse --verify -q feature/login >/dev/null && git log feature/login --format=%s | head -1 | grep -qi login && git cat-file -e feature/login:login.txt && ! git cat-file -e main:login.txt 2>/dev/null`,
    solution: String.raw`cd ~/lab/repo && git switch -q -c feature/login && git add login.txt && git commit -qm "add login page"`,
  }),
  lab({
    id: 'processes-kill', level: 'intermediate', category: 'linux', minutes: 8,
    title: 'Find and stop a process',
    goal: 'Inspect running processes and terminate the right one.',
    tasks: ['A process is running `sleep 4242` in the background.', 'Find its PID and stop it. Do not stop anything else.'],
    concepts: ['ps aux', 'pgrep', 'kill', 'pkill'],
    hints: ['`ps aux | grep sleep` lists matching processes.', '`pgrep -f "sleep 4242"` prints just the PID.', '`kill <PID>` (or `pkill -f "sleep 4242"`).'],
    setup: String.raw`(nohup sleep 4242 >/dev/null 2>&1 &)
(nohup sleep 4243 >/dev/null 2>&1 &)`,
    check: String.raw`! pgrep -f '[s]leep 4242' >/dev/null && pgrep -f '[s]leep 4243' >/dev/null`,
    solution: String.raw`pkill -f '[s]leep 4242'`,
  }),
  lab({
    id: 'cron-syntax', level: 'intermediate', category: 'linux', minutes: 8,
    title: 'Write crontab entries',
    goal: 'Schedule jobs with correct cron syntax.',
    tasks: ['Create ~/lab/crontab.txt with two lines:', '1) run /home/learner/backup.sh every day at 02:30', '2) run /home/learner/cleanup.sh every Monday at 06:00'],
    concepts: ['crontab format', 'minute hour dom month dow'],
    hints: ['Fields are: minute hour day-of-month month day-of-week command.', 'Every day at 02:30 → `30 2 * * *`.', 'Monday is 1 → `0 6 * * 1 /home/learner/cleanup.sh`.'],
    setup: 'mkdir -p ~/lab',
    check: String.raw`grep -Eq '^30 +2 +\* +\* +\* +/home/learner/backup\.sh' ~/lab/crontab.txt && grep -Eq '^0 +6 +\* +\* +(1|MON|mon) +/home/learner/cleanup\.sh' ~/lab/crontab.txt`,
    solution: String.raw`printf '30 2 * * * /home/learner/backup.sh\n0 6 * * 1 /home/learner/cleanup.sh\n' > ~/lab/crontab.txt`,
  }),
  lab({
    id: 'disk-biggest', level: 'intermediate', category: 'linux', minutes: 8,
    title: 'What is eating the disk?',
    goal: 'Track down the largest file in a directory tree.',
    tasks: ['Find the single largest file anywhere under ~/lab/data.', 'Write its full path to ~/answer.txt.'],
    concepts: ['du -a', 'sort -rn', 'ls -S', 'find -size'],
    hints: ['`du -a ~/lab/data` lists every file with its size.', 'Sort the sizes in descending order: `du -a ... | sort -rn | head`.', 'The biggest *file* (not directory) is the first line that is not a folder.'],
    setup: String.raw`mkdir -p ~/lab/data/cache ~/lab/data/archive ~/lab/data/logs
head -c 1000 /dev/zero > ~/lab/data/cache/a.dat
head -c 40000 /dev/zero > ~/lab/data/logs/b.log
head -c 90000 /dev/zero > ~/lab/data/archive/big.bin
head -c 20000 /dev/zero > ~/lab/data/c.dat`,
    check: `${ANS}\n[ "$(basename "$(ans)")" = "big.bin" ] && [ -f "$(ans)" ]`,
    solution: String.raw`ls -S ~/lab/data/*/* | head -1 > ~/answer.txt`,
  }),
  lab({
    id: 'jq-json', level: 'intermediate', category: 'devops', minutes: 10,
    title: 'Query JSON with jq',
    goal: 'Parse API / kubectl-style JSON output on the command line.',
    tasks: ['~/lab/pods.json lists pods and their status.', 'Write the names of every pod whose status is NOT "Running" to ~/answer.txt, one per line, sorted.'],
    concepts: ['jq', 'select()', 'raw output (-r)'],
    hints: ['`jq . ~/lab/pods.json` pretty-prints it.', '`jq -r \'.[] | .name\'` prints every name.', '`jq -r \'.[] | select(.status != "Running") | .name\' ~/lab/pods.json | sort > ~/answer.txt`'],
    requires: ['jq'],
    setup: String.raw`mkdir -p ~/lab
echo '[{"name":"api","status":"Running"},{"name":"worker","status":"CrashLoopBackOff"},{"name":"db","status":"Running"},{"name":"cache","status":"Error"}]' > ~/lab/pods.json`,
    check: String.raw`[ "$(tr -d '\r' < ~/answer.txt)" = "$(printf 'cache\nworker')" ]`,
    solution: String.raw`jq -r '.[] | select(.status != "Running") | .name' ~/lab/pods.json | sort > ~/answer.txt`,
  }),
  lab({
    id: 'curl-local-server', level: 'intermediate', category: 'devops', minutes: 8,
    title: 'Call an HTTP endpoint with curl',
    goal: 'Talk to a service from the command line.',
    tasks: ['A small web server is running on localhost:7300.', 'Use curl to download /flag.txt and save its content to ~/answer.txt.'],
    concepts: ['curl -s', 'curl -o', 'localhost', 'HTTP'],
    hints: ['`curl http://localhost:7300/` shows the directory listing.', '`-s` silences the progress bar.', '`curl -s http://localhost:7300/flag.txt > ~/answer.txt`'],
    requires: ['curl', 'python3'],
    setup: String.raw`mkdir -p ~/lab/www && echo "curl-works-9921" > ~/lab/www/flag.txt
(cd ~/lab/www && nohup python3 -m http.server 7300 --bind 127.0.0.1 >/dev/null 2>&1 &)
sleep 1`,
    check: `${ANS}\n[ "$(ans)" = "curl-works-9921" ]`,
    solution: String.raw`curl -s http://127.0.0.1:7300/flag.txt > ~/answer.txt`,
  }),
  lab({
    id: 'ss-port', level: 'intermediate', category: 'devops', minutes: 8,
    title: 'Which port is the mystery service on?',
    goal: 'Discover listening sockets.',
    tasks: ['A service is listening on a TCP port somewhere between 7400 and 7499.', 'Find the port and write the number to ~/answer.txt.'],
    concepts: ['ss -ltn', 'netstat', 'lsof -i'],
    hints: ['`ss -ltn` lists listening TCP sockets.', 'Add `-p` to see which process owns each socket.', 'Filter the range: `ss -ltn | grep :74`.'],
    requires: ['python3'],
    setup: String.raw`mkdir -p ~/lab/www
(cd ~/lab/www && nohup python3 -m http.server 7431 --bind 127.0.0.1 >/dev/null 2>&1 &)
sleep 1`,
    check: `${ANS}\n[ "$(ans)" = "7431" ]`,
    solution: 'echo 7431 > ~/answer.txt',
  }),
  lab({
    id: 'systemd-unit', level: 'intermediate', category: 'devops', minutes: 10,
    title: 'Write a systemd service unit',
    goal: 'Describe a service so systemd can run and restart it.',
    tasks: ['Create ~/lab/myapp.service with [Unit], [Service] and [Install] sections.', 'It must run `/usr/bin/node /srv/app/server.js` as user `app`, restart on failure, and be wanted by multi-user.target.'],
    concepts: ['unit files', 'ExecStart', 'Restart=on-failure', 'WantedBy'],
    hints: ['A unit has three sections: [Unit], [Service], [Install].', 'Keys you need: Description, ExecStart, User, Restart, WantedBy.', 'Restart=on-failure and WantedBy=multi-user.target.'],
    setup: 'mkdir -p ~/lab',
    check: String.raw`f=~/lab/myapp.service; grep -qx '\[Unit\]' $f && grep -qx '\[Service\]' $f && grep -qx '\[Install\]' $f && grep -Eq '^ExecStart=/usr/bin/node /srv/app/server\.js' $f && grep -qx 'Restart=on-failure' $f && grep -qx 'User=app' $f && grep -qx 'WantedBy=multi-user.target' $f`,
    solution: String.raw`printf '[Unit]\nDescription=My App\n\n[Service]\nExecStart=/usr/bin/node /srv/app/server.js\nUser=app\nRestart=on-failure\n\n[Install]\nWantedBy=multi-user.target\n' > ~/lab/myapp.service`,
  }),
  lab({
    id: 'dockerfile-fix', level: 'intermediate', category: 'devops', minutes: 12,
    title: 'Harden a Dockerfile',
    goal: 'Fix the three most common Dockerfile mistakes.',
    tasks: ['Edit ~/lab/docker/Dockerfile:', '1) pin the base image to a version (e.g. node:20-alpine), not :latest', '2) copy package*.json and install dependencies BEFORE copying the rest (layer caching)', '3) do not run as root (add a USER line)', 'Also create ~/lab/docker/.dockerignore that lists node_modules.'],
    concepts: ['image pinning', 'layer caching', 'USER', '.dockerignore'],
    hints: ['`FROM node:20-alpine` instead of `node:latest`.', 'Order matters: `COPY package*.json ./`, `RUN npm ci`, then `COPY . .`.', 'The official node images ship a `node` user: add `USER node` before CMD.'],
    setup: String.raw`mkdir -p ~/lab/docker
cat > ~/lab/docker/Dockerfile <<'EOF'
FROM node:latest
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]
EOF`,
    check: String.raw`cd ~/lab/docker
grep -Eq '^FROM +[a-z0-9./_-]+:[0-9]' Dockerfile && ! grep -Eq '^FROM .*:latest' Dockerfile || exit 1
first=$(grep -E '^COPY ' Dockerfile | head -1); echo "$first" | grep -q 'package' || exit 1
grep -E '^USER ' Dockerfile | grep -viq 'root' || exit 1
grep -q 'node_modules' .dockerignore`,
    solution: String.raw`cd ~/lab/docker && printf 'FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nUSER node\nEXPOSE 3000\nCMD ["node", "server.js"]\n' > Dockerfile && echo node_modules > .dockerignore`,
  }),
  lab({
    id: 'compose-fix', level: 'intermediate', category: 'devops', minutes: 12,
    title: 'Stop leaking your database',
    goal: 'Fix an insecure docker-compose.yml.',
    tasks: ['In ~/lab/compose/docker-compose.yml the database is published to the whole internet and its password is hard-coded.', `Bind the database port to 127.0.0.1 only (or remove it) and replace the literal password with ${D}{DB_PASSWORD}.`],
    concepts: ['docker compose ports', 'loopback binding', 'env var substitution'],
    hints: ['`"5432:5432"` publishes on every interface.', 'Prefix the host side with the loopback address: `"127.0.0.1:5432:5432"`.', `Use POSTGRES_PASSWORD: ${D}{DB_PASSWORD} so the value comes from a .env file.`],
    requires: ['python3', 'py:yaml'],
    setup: String.raw`mkdir -p ~/lab/compose
cat > ~/lab/compose/docker-compose.yml <<'EOF'
services:
  web:
    image: myapp:1.0
    ports:
      - "8080:80"
    depends_on:
      - db
  db:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: supersecret123
EOF`,
    check: String.raw`python3 - <<'PY'
import yaml, os, sys
d = yaml.safe_load(open(os.path.expanduser('~/lab/compose/docker-compose.yml')))
db = d['services']['db']
for p in db.get('ports', []):
    if not str(p).startswith('127.0.0.1:'):
        sys.exit(1)
env = db.get('environment', {})
if isinstance(env, list):
    env = dict(e.split('=', 1) for e in env)
if not str(env.get('POSTGRES_PASSWORD', '')).startswith('$'):
    sys.exit(1)
PY`,
    solution: `cd ~/lab/compose && sed -i.bak -e 's/"5432:5432"/"127.0.0.1:5432:5432"/' -e 's/supersecret123/${D}{DB_PASSWORD}/' docker-compose.yml`,
  }),

  // ───────────────────────────── Advanced (incident drills) ─────────────────────────────
  lab({
    id: 'incident-disk-full', level: 'advanced', category: 'incident', minutes: 12,
    title: 'Incident: the disk is full',
    goal: 'Free space safely on a server whose logs filled the disk.',
    tasks: ['Alerts say /var/log is 100% full. Logs live in ~/lab/var/log/app.', 'Delete the old rotated logs (*.1 and *.gz files).', 'The live log app.log is held open by a running process: do NOT delete it — empty it instead (truncate). Leave access.log untouched.'],
    concepts: ['du -sh', 'ls -lS', 'truncate / : >', 'open file handles', 'log rotation'],
    hints: ['`du -sh ~/lab/var/log/app/*` shows which files are big.', 'Deleting a file that a process still has open does NOT free the space. Empty it in place instead.', '`truncate -s 0 ~/lab/var/log/app/app.log` (or `: > app.log`) and `rm` the *.1 / *.gz files.'],
    setup: String.raw`mkdir -p ~/lab/var/log/app && cd ~/lab/var/log/app
head -c 1500000 /dev/zero | tr '\0' 'x' > app.log
head -c 1000000 /dev/zero | tr '\0' 'y' > app.log.1
head -c 800000 /dev/zero | tr '\0' 'z' > app.log.2.gz
echo "GET /health 200" > access.log
(nohup tail -f ~/lab/var/log/app/app.log >/dev/null 2>&1 &)`,
    check: String.raw`cd ~/lab/var/log/app && [ -f app.log ] && [ ! -s app.log ] && [ -z "$(ls *.1 *.gz 2>/dev/null)" ] && [ -s access.log ]`,
    solution: String.raw`cd ~/lab/var/log/app && rm -f app.log.1 app.log.2.gz && : > app.log`,
  }),
  lab({
    id: 'incident-service-down', level: 'advanced', category: 'incident', minutes: 15,
    title: 'Incident: the service will not start',
    goal: 'Debug a failing start script by reading its errors, one at a time.',
    tasks: ['The service in ~/lab/svc must start with ./start.sh and write RUNNING into ~/lab/svc/state.', 'Run it, read the error, fix the cause, repeat. There is more than one fault.'],
    concepts: ['reading error messages', 'exit codes ($?)', 'chmod +x', 'config files', 'mkdir'],
    hints: ['Start with `cd ~/lab/svc && ./start.sh` and read the very first error.', '"Permission denied" = missing execute bit. Other errors name the exact file or setting that is wrong.', 'Faults: not executable, `port` must be a number, `db_host` is empty, and a missing `logs` directory.'],
    setup: String.raw`mkdir -p ~/lab/svc && cd ~/lab/svc
cat > start.sh <<'EOF'
#!/bin/bash
cd "$(dirname "$0")"
[ -f config.ini ] || { echo "ERROR: config.ini not found"; exit 1; }
DB_HOST=$(grep '^db_host=' config.ini | cut -d= -f2)
PORT=$(grep '^port=' config.ini | cut -d= -f2)
[ -n "$DB_HOST" ] || { echo "ERROR: db_host is not set in config.ini"; exit 2; }
case "$PORT" in ''|*[!0-9]*) echo "ERROR: port must be a number, got '$PORT'"; exit 3;; esac
[ -d logs ] || { echo "ERROR: cannot write logs: directory ./logs does not exist"; exit 4; }
echo RUNNING > state
echo "service started on port $PORT, db=$DB_HOST" >> logs/service.log
echo "OK: service running"
EOF
chmod 644 start.sh
printf 'port=eighty\ndb_host=\n' > config.ini`,
    check: String.raw`cd ~/lab/svc && [ -x start.sh ] && rm -f state && ./start.sh >/dev/null 2>&1 && [ "$(cat state)" = "RUNNING" ]`,
    solution: String.raw`cd ~/lab/svc && chmod +x start.sh && printf 'port=8080\ndb_host=db.internal\n' > config.ini && mkdir -p logs && ./start.sh`,
  }),
  lab({
    id: 'incident-cpu-hog', level: 'advanced', category: 'incident', minutes: 10,
    title: 'Incident: a process is eating the CPU',
    goal: 'Find a runaway process and stop only that one.',
    tasks: ['The server is crawling. Find the process using the most CPU and stop it.', 'There is also an innocent `sleep 9999` process — it must keep running.'],
    concepts: ['top / htop', 'ps aux --sort=-%cpu', 'kill', 'pkill -f'],
    hints: ['`top` (press q to quit) or `ps aux --sort=-%cpu | head` shows who is busy.', 'Note the command line of the busiest process.', '`kill <PID>` or `pkill -f report-generator`.'],
    setup: String.raw`mkdir -p ~/lab
printf '#!/bin/bash\nwhile :; do :; done\n' > ~/lab/report-generator.sh
(nohup bash ~/lab/report-generator.sh >/dev/null 2>&1 &)
(nohup sleep 9999 >/dev/null 2>&1 &)`,
    check: String.raw`! pgrep -f '[r]eport-generator.sh' >/dev/null && pgrep -f '[s]leep 9999' >/dev/null`,
    solution: "pkill -f '[r]eport-generator.sh'",
  }),
  lab({
    id: 'incident-permissions', level: 'advanced', category: 'incident', minutes: 10,
    title: 'Incident: permission denied on the web root',
    goal: 'Fix permissions with the minimum access needed — never chmod 777.',
    tasks: ['The site in ~/lab/site cannot be served: index.html is unreadable, and uploads/ cannot be written to.', 'Make index.html readable and uploads/ writable by you.', 'Neither may be writable by "others" (no 777 / o+w).'],
    concepts: ['ls -ld', 'chmod 644 / 755', 'least privilege'],
    hints: ['`ls -l ~/lab/site` and `ls -ld ~/lab/site/uploads` show the modes.', 'Files usually want 644, directories 755.', '`chmod 644 index.html; chmod 755 uploads`'],
    setup: String.raw`mkdir -p ~/lab/site/uploads && echo "<h1>hi</h1>" > ~/lab/site/index.html
chmod 000 ~/lab/site/index.html; chmod 555 ~/lab/site/uploads`,
    check: String.raw`cd ~/lab/site && [ -r index.html ] && [ -w uploads ] && [ "$(ls -l index.html | cut -c9)" != "w" ] && [ "$(ls -ld uploads | cut -c9)" != "w" ]`,
    solution: 'cd ~/lab/site && chmod 644 index.html && chmod 755 uploads',
  }),
  lab({
    id: 'incident-port-conflict', level: 'advanced', category: 'incident', minutes: 12,
    title: 'Incident: address already in use',
    goal: 'Free a port that another process is holding.',
    tasks: ['~/lab/app/start-app.sh needs port 8081 but fails with "Address already in use".', 'Find what holds port 8081, stop it, and start the app so ~/lab/app/status says "started".', 'A different process on port 8082 must keep running.'],
    concepts: ['ss -ltnp', 'lsof -i :8081', 'pkill -f', 'exit codes'],
    hints: ['`ss -ltnp | grep 8081` shows the owner of the port.', 'Match the right process by its command line, not just "python".', '`pkill -f "http.server 8081"` then `bash ~/lab/app/start-app.sh`.'],
    requires: ['python3'],
    setup: String.raw`mkdir -p ~/lab/app
(nohup python3 -m http.server 8081 --bind 127.0.0.1 >/dev/null 2>&1 &)
(nohup python3 -m http.server 8082 --bind 127.0.0.1 >/dev/null 2>&1 &)
cat > ~/lab/app/start-app.sh <<'EOF'
#!/bin/bash
python3 - <<'PY' || { echo "ERROR: port 8081 is not available (Address already in use)"; exit 1; }
import socket
s = socket.socket()
s.bind(("127.0.0.1", 8081))
PY
echo started > "$HOME/lab/app/status"
echo "app started"
EOF
chmod +x ~/lab/app/start-app.sh
sleep 1`,
    check: String.raw`rm -f ~/lab/app/status; bash ~/lab/app/start-app.sh >/dev/null 2>&1; [ "$(cat ~/lab/app/status 2>/dev/null)" = "started" ] && pgrep -f 'http.server 808[2]' >/dev/null`,
    solution: String.raw`pkill -f 'http.server 808[1]'; sleep 1; bash ~/lab/app/start-app.sh`,
  }),
  lab({
    id: 'incident-deploy-blame', level: 'advanced', category: 'incident', minutes: 12,
    title: 'Incident: which deploy broke production?',
    goal: 'Correlate two logs by timestamp.',
    tasks: ['Errors started in production. ~/lab/logs/error.log has the errors, ~/lab/logs/deploy.log has every deployment.', 'Find the time of the FIRST ERROR, then the last version deployed before it. Write that version (e.g. v1.2.3) to ~/answer.txt.'],
    concepts: ['grep -m1', 'sort', 'timestamps', 'log correlation'],
    hints: ['`grep -m1 ERROR ~/lab/logs/error.log` gives the first error line.', 'Look at deploy.log with `cat`: which deploy time is just before that timestamp?', 'ISO timestamps sort alphabetically, so `sort` works on them.'],
    setup: String.raw`mkdir -p ~/lab/logs
printf '2024-05-01T09:12:00 deployed v1.4.1\n2024-05-01T09:58:41 deployed v1.4.2\n2024-05-01T10:05:09 deployed v1.4.3\n2024-05-01T10:31:55 deployed v1.4.4\n' > ~/lab/logs/deploy.log
printf '2024-05-01T09:30:02 INFO request ok\n2024-05-01T09:41:19 WARN slow query\n2024-05-01T10:02:44 INFO request ok\n2024-05-01T10:07:13 ERROR db connection timeout\n2024-05-01T10:07:15 ERROR db connection timeout\n2024-05-01T10:20:01 ERROR upstream 502\n' > ~/lab/logs/error.log`,
    check: `${ANS}\n[ "$(ans)" = "v1.4.3" ]`,
    solution: 'echo v1.4.3 > ~/answer.txt',
  }),
  lab({
    id: 'incident-broken-backup', level: 'advanced', category: 'incident', minutes: 15,
    title: 'Incident: the backup script silently fails',
    goal: 'Debug a shell script that breaks on a path with spaces.',
    tasks: ['Run ~/lab/backup.sh. It should create ~/lab/backups/backup.tar.gz containing the contents of "~/lab/my data", but it fails.', 'Fix the script (hint: quoting). Keep `set -e`.'],
    concepts: ['quoting "$VAR"', 'set -e', 'bash -x debugging', 'shellcheck'],
    hints: ['Run it with `bash -x ~/lab/backup.sh` to see each command expand.', 'A path containing a space is split into two arguments unless it is quoted.', 'Put double quotes around every variable: `"$SRC"` and `"$DEST"`.'],
    setup: String.raw`mkdir -p ~/lab "$HOME/lab/my data"
echo "important notes" > "$HOME/lab/my data/notes.txt"
cat > ~/lab/backup.sh <<'EOF'
#!/bin/bash
set -e
SRC=$HOME/lab/my\ data
DEST=$HOME/lab/backups
mkdir -p $DEST
tar -czf $DEST/backup.tar.gz -C $SRC .
echo "backup created"
EOF`,
    check: String.raw`rm -rf ~/lab/backups; bash ~/lab/backup.sh >/dev/null 2>&1 && tar -tzf ~/lab/backups/backup.tar.gz | grep -q notes.txt && grep -q '^set -e' ~/lab/backup.sh`,
    solution: String.raw`cat > ~/lab/backup.sh <<'EOF'
#!/bin/bash
set -e
SRC="$HOME/lab/my data"
DEST="$HOME/lab/backups"
mkdir -p "$DEST"
tar -czf "$DEST/backup.tar.gz" -C "$SRC" .
echo "backup created"
EOF`,
  }),
  lab({
    id: 'k8s-manifest-fix', level: 'advanced', category: 'devops', minutes: 15,
    title: 'Make a Kubernetes Deployment production-ready',
    goal: 'Add the things reviewers always ask for.',
    tasks: ['Edit ~/lab/k8s/deployment.yaml so the container:', '• uses a pinned image tag (not :latest)', '• sets resources.limits for cpu and memory', '• has a readinessProbe'],
    concepts: ['image tags', 'resources.limits', 'readinessProbe', 'YAML indentation'],
    hints: ['Indentation matters in YAML: use spaces, never tabs.', 'Limits look like `resources: { limits: { cpu: 500m, memory: 256Mi } }`.', 'A simple probe: `readinessProbe: { httpGet: { path: /health, port: 3000 } }`.'],
    requires: ['python3', 'py:yaml'],
    setup: String.raw`mkdir -p ~/lab/k8s
cat > ~/lab/k8s/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: myorg/web:latest
          ports:
            - containerPort: 3000
EOF`,
    check: String.raw`python3 - <<'PY'
import yaml, os, sys
d = yaml.safe_load(open(os.path.expanduser('~/lab/k8s/deployment.yaml')))
c = d['spec']['template']['spec']['containers'][0]
img = c['image']
if ':' not in img or img.endswith(':latest'):
    sys.exit(1)
lim = (c.get('resources') or {}).get('limits') or {}
if 'cpu' not in lim or 'memory' not in lim:
    sys.exit(1)
if not c.get('readinessProbe'):
    sys.exit(1)
PY`,
    solution: String.raw`cat > ~/lab/k8s/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: myorg/web:1.4.3
          ports:
            - containerPort: 3000
          resources:
            limits:
              cpu: 500m
              memory: 256Mi
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
EOF`,
  }),
];

const BY_ID = new Map(LABS.map((l) => [l.id, l]));
const getLab = (id) => BY_ID.get(id) || null;

/** What the browser may see: never the setup, check or solution scripts. */
const publicLab = ({ setup, check, solution, requires, hints, ...rest }) => ({ ...rest, hintCount: hints.length });

module.exports = { LABS, LEVELS, XP, getLab, publicLab };
