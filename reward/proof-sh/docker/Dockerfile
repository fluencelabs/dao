FROM alpine

RUN wget https://gitlab.com/kurdy/sha3sum/uploads/95b6ec553428e3940b3841fc259d02d4/sha3sum-x86_64_Linux-1.1.0.tar.gz -O - | tar xvz
RUN cp sha3sum /usr/local/bin/
RUN wget https://github.com/FiloSottile/age/releases/download/v1.0.0/age-v1.0.0-linux-amd64.tar.gz -O - | tar xvz
RUN cp age/age /usr/local/bin/
RUN apk add --no-cache bash tini openssl

COPY proof.sh /usr/local/bin/
COPY output/metadata.bin /output/

WORKDIR /

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/proof.sh"]
