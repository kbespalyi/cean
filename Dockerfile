FROM node:9.1.0 AS build

ARG PORT=5400

RUN if [ "x$PORT" = "x" ] ; then echo The PORT argument not provided ; else echo The running port is $PORT ; fi

ENV PORT=$PORT
EXPOSE $PORT

ENV NODE_ENV production
ENV NPM_CONFIG_LOGLEVEL warn

# Setup service
ENV DIR=/usr/src/service
ENV APP_HOME /usr/src/app

# setup application dir
RUN mkdir -vp $APP_HOME

WORKDIR $APP_HOME

COPY ./src $APP_HOME/src
COPY ./frontend/dist $APP_HOME/website

# setup user home dir
ENV USER node

RUN chown -R $USER:$USER $APP_HOME
USER $USER

# Install NPM packages first
ADD ./package.json $APP_HOME/package.json
ADD ./package-lock.json $APP_HOME/package-lock.json
ADD ./.env $APP_HOME/.env

#RUN rm -rf node_modules
#COPY $DIR/node_modules $APP_HOME/node_modules

RUN npm install --silent

#HEALTHCHECK --interval=5s \
#            --timeout=5s \
#            --retries=6 \
#            CMD curl -fs http://localhost:$PORT/_health || exit 1

CMD ["npm", "start"]
