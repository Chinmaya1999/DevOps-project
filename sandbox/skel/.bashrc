# Learner shell: friendly prompt, safe defaults, a few aliases.
export PS1='\[\e[1;32m\]learner\[\e[0m\]@sandbox:\[\e[1;34m\]\w\[\e[0m\]\$ '
export EDITOR=nano
export HISTSIZE=1000
alias ll='ls -alF'
alias la='ls -A'
alias grep='grep --color=auto'
alias ls='ls --color=auto'
if [ -z "$SANDBOX_WELCOMED" ] && [ -f ~/WELCOME.txt ]; then cat ~/WELCOME.txt; fi
