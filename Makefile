ci:
	make docker-build \
		clean \
		install \
		staging
#		 \
#		staging-down

ci-local:
	make docker-build \
		local-run

docker-build:
	docker build -f Dockerfile --build-arg PORT=3000 -t kbespalyi/cean-api-server .
clean:
	#docker-compose -f docker-compose.yml run --rm clean
install:
	#docker-compose -f docker-compose.yml run --rm install
staging:
	docker-compose -f docker-compose.yml up -d website
staging-run:
	docker-compose -f docker-compose.yml run --rm website
staging-down:
	docker-compose -f docker-compose.yml down

local-run:
	docker run -p 80:3000 --env-file .env kbespalyi/cean-api-server node ./src/server.js

couchbase-start:
	docker run -d --name db -p 8091-8094:8091-8094 -p 11210:11210 couchbase

herokuci:
	make link \
		unlink \
		patch
link:
	heroku plugins:link "$(shell pwd)"
unlink:
	heroku plugins:uninstall heroku-docker
patch:
	npm version patch
	git push
	npm publish
