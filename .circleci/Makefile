include .env
export

couchbase:
	make docker-build \
		docker-run \
		couchbase-test \
		couchbase-done \
		cean-test

docker-build:
	docker build -t ${IMAGE_NAME}:${CIRCLE_BUILD_NUM} .
docker-run:
	#docker stop couchtest
	#docker rm couchtest
	docker run -d --name couchtest --env-file .env -h ${COUCHBASE_HOST} -p 8091-8094:8091-8094 -p 9110:9110 -p 11207:11207 -p 11210:11210 -p 11211:11211 -p 18091-18094:18091-18094 -t ${IMAGE_NAME}:${CIRCLE_BUILD_NUM}
	#--net=couchbase -h ${COUCHBASE_HOST}
docker-stop:
	docker stop --name couchtest
docker-net:
	make docker-net-create \
		docker-nginx-create \
		docker-net-connect-nginx
docker-net-create:
	#docker stop couchtest
	#docker network remove couchbase
	docker network create couchbase
docker-nginx-create:
	#docker rm my-nginx
	docker create --name my-nginx --net=couchbase --publish ${COUCHBASE_PORT}:${COUCHBASE_PORT} nginx:latest
docker-net-connect-nginx:
	docker network connect couchbase my-nginx
couchbase-test:
	sleep 10
	curl -X GET -u ${ADMIN_LOGIN}:${ADMIN_PASSWORD} --retry 5 --retry-delay 10 -v http://${COUCHBASE_HOST}:${COUCHBASE_PORT}/pools/default/buckets -C -
couchbase-done:
	echo "Done!"
cean-test:
	npm test
