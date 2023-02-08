####################
FROM node:alpine
WORKDIR /scripts

ARG version
ENV NODE_ENV=production

RUN yarn global add ymlr@$version pnpm
RUN pnpm config -g set store-dir /home/node/.pnpm-store && \
    mkdir /my-tags && \
    echo -e '- Welcome to ymlr container' > /scripts/index.yaml

ENTRYPOINT ["ymlr", "--tagDirs", "/my-tags", "--"]
CMD ["/scripts/index.yaml", ""]
