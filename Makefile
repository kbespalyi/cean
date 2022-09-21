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
	docker build -f Dockerfile --build-arg PORT=5400 -t kbespalyi/cean-api-server .
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
	docker run -p 80:5400 --env-file .env kbespalyi/cean-api-server `DB=couchbase node ./src/server.js`

couchbase-start:
	docker run -d --name couchtest --env-file .env -p 8091-8094:8091-8094 -p 9110:9110 -p 11207-11211:11207-11211 -p 18091-18094:18091-18094 -t ${IMAGE_NAME}:${CIRCLE_BUILD_NUM}

herokuci:
	make link \
		unlink \
		patch
link:
	heroku plugins:link "$(shell pwd)"
unlink:
	heroku plugins:uninstall heroku-docker
patch:
	yarn version patch
	git push
	yarn publish
