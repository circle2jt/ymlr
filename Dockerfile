####################
ARG NODE_VERSION=latest

FROM node:$NODE_VERSION
WORKDIR /scripts

ARG VERSION=latest

ENV NODE_ENV=production

RUN yarn global add ymlr@$VERSION pnpm
RUN pnpm config -g set store-dir /home/node/.pnpm-store && \
    mkdir /my-tags && \
    echo -e '- Welcome to ymlr container' > /scripts/index.yaml

ENTRYPOINT ["ymlr", "--tagDirs", "/my-tags", "--"]
CMD ["/scripts/index.yaml", ""]
