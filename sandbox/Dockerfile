# Image every learner sandbox starts from. Build and load it on the SANDBOX host (see docs/sandbox.md):
#   docker build -t cmdevops-sandbox:latest sandbox/
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive LANG=C.UTF-8

RUN apt-get update && apt-get install -y --no-install-recommends \
      bash coreutils findutils grep sed gawk diffutils tar gzip bzip2 xz-utils zip unzip bc file less tree \
      procps psmisc lsof iproute2 net-tools iputils-ping dnsutils curl wget ca-certificates \
      jq git openssh-client vim-tiny nano \
      python3 python3-yaml shellcheck man-db manpages \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 1000 --shell /bin/bash learner \
    && mkdir -p /opt/sandbox

COPY init.sh /opt/sandbox/init.sh
COPY skel/ /opt/sandbox/skel/
RUN chmod 755 /opt/sandbox/init.sh && chmod -R a+rX /opt/sandbox

USER learner
WORKDIR /home/learner
# The container is started with `sleep infinity`; the terminal is a separate exec session.
CMD ["sleep", "infinity"]
