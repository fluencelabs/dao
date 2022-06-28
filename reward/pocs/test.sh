#!/usr/bin/env bash

# FOUND_SSH_KEYS=$(find $HOME/.ssh -mindepth 1 -maxdepth 1 ! -name "*.pub" ! -name "known_hosts*" ! -name "config" ! -name "*.log")

ask_ssh_key() {
    SSH_KEYS=()
    while IFS=  read -r -d $'\0'; do
        SSH_KEYS+=("$REPLY")
    done < <(find $HOME/.ssh -mindepth 1 -maxdepth 1 ! -name "*.pub" ! -name "known_hosts*" ! -name "config" ! -name "*.log" -print0)

    select fname in ${SSH_KEYS[@]}
    do
        echo $fname
        break;
    done
}

ask_ssh_key


# createmenu ()
# {
#   echo "Size of array: $#"
#   echo "$@"
#   select option; do # in "$@" is the default
#     if [ "$REPLY" -eq "$#" ];
#     then
#       echo "Exiting..."
#       break;
#     elif [ 1 -le "$REPLY" ] && [ "$REPLY" -le $(($#-1)) ];
#     then
#       echo "You selected $option which is option $REPLY"
#       break;
#     else
#       echo "Incorrect Input: Select a number 1-$#"
#     fi
#   done
# }

# createmenu "${buckets[@]}"

# https://stackoverflow.com/questions/28325915/create-bash-select-menu-with-array-argument