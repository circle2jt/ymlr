####################
ARG NODE_VERSION=latest

FROM node:$NODE_VERSION
WORKDIR /scripts

ARG VERSION=latest

ENV NODE_ENV=production
ENV PACKAGE_MANAGERS=yarn,npm

RUN mkdir /my-tags && \
    echo -e '- echo: Welcome to ymlr container' > /scripts/index.yaml
RUN yarn global add ymlr@$VERSION

ENTRYPOINT ["ymlr", "--tag-dirs=/my-tags"]
CMD ["/scripts/index.yaml", ""]
