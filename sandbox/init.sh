#!/bin/bash
# Runs once when a sandbox starts: /home/learner is an empty tmpfs, so populate it.
cp -a /opt/sandbox/skel/. "$HOME"/
