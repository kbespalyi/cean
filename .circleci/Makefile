couchbase:
	make docker-build \
		docker-run \
		couchbase-test

docker-build:
	docker build -f Dockerfile -t couchtest .
docker-run:
	docker run -d --name couchtest -p 8090-8099:8090-8099 -p 9110:9110 -p 11210:11210 -p 18091:18091 -p 18092:18092 -t couchtest
docker-stop:
	docker stop --name couchtest
couchbase-test:
	curl --retry 20 --retry-delay 10 -v http://localhost:8091/pools/default/buckets -C -
