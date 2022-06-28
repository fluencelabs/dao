FROM rust:alpine3.15 as BUILD

RUN mkdir -p /binaries
RUN cargo install sha3sum
RUN cp /usr/local/cargo/bin/sha3sum /binaries/
RUN wget https://github.com/FiloSottile/age/releases/download/v1.0.0/age-v1.0.0-linux-amd64.tar.gz -O - | tar xvz
RUN cp age/age /binaries/

# FROM bitnami/minideb:bullseye
# FROM ghcr.io/linuxserver/baseimage-ubuntu:focal
FROM alpine
RUN apk add --no-cache bash tini openssl

COPY --from=BUILD /binaries/age /usr/local/bin/
COPY --from=BUILD /binaries/sha3sum /usr/local/bin/
COPY proof.sh /usr/local/bin/
COPY workdir /workdir

WORKDIR /

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/proof.sh"]

