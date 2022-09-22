# Tube-resource: https://www.youtube.com/watch?v=1xo-0gCVhTU
# Web-resource https://medium.com/@patrickleet/i-have-a-confession-to-make-i-commit-to-master-6a804f334beb

# Couchbase resources:
https://hub.docker.com/r/couchbase/server/
https://www.thepolyglotdeveloper.com/2015/10/create-a-full-stack-app-using-node-js-couchbase-server/
https://blog.couchbase.com/containerize-node-js-application-communicates-couchbase-server/

# - create index
CREATE PRIMARY INDEX ON `default` USING GSI;

# - change port to by default
>"/Applications/Couchbase Server.app/Contents/Resources/couchbase-core/bin/couchbase-cli" setting-cluster -c localhost:8091 --username Administrator --password password --cluster-port=9091

# Get access to couchbase console
>cbq -u Administrator -p password -e "http://localhost:9091"
# Create the primary index
cbq> CREATE PRIMARY INDEX ON `default` USING GSI;
cbq> SELECT * FROM default LIMIT 1;
cbq> \QUIT;

# Front-end desing using Vue CLI: https://github.com/vuejs-templates/webpack

vue init webpack frontend
cd frontend
yarn run dev
yarn run build
yarn start


# Docker, compose

# Automating the pipeline

make ci

# Docker build

1) docker image build -f Dockerfile -t kbespalyi/cean-api-server .
2) docker stack deploy
3) docker-compose -f docker-compose.yml up -d website

# Docker run cean-service

docker-compose -f docker-compose.yml run --rm website

# Docker Inspect IP
docker inspect cean_couchbase_1
docker inspect cean_cean-service_1
docker inspect cean_website_1

# Test network

1) docker run --name webtest --net=cean_back-tier -d nginx:alpine
2) docker run --rm -it --net=cean_back-tier alpine ping -c 1 webtest

# USING Heroku service
heroku login
heroku git:remote -a cean-api-server
git push heroku master
heroku logs -t -p web.1 -a cean-api-server

heroku local web
heroku local ps:stop web


# USING Kubernetes Cluster on Docker for Mac 18.01 using Swarm CLI
# resource: http://collabnix.com/running-kubernetes-cluster-on-docker-for-mac-18-01-using-swarm-cli/

# Checking
kubectl version
docker stack ls

# install
docker swarm init
brew install kubectl
curl -Lo minikube https://storage.googleapis.com/minikube/releases/v0.24.1/minikube-darwin-amd64 && chmod +x minikube && sudo mv minikube /usr/local/bin/
minikube start

kubectl get services --namespace=kube-system

# Deploy to Kubernetes
docker stack deploy -c docker-compose.yml kbespalyi/cean-api-server
docker stack ls

# Checking services
kubectl get svc

# Checking pods
kubectl get pods

# Removing services
docker stack rm cean-api-server
