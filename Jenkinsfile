pipeline {
    agent any

    environment {
        MOCKOON_IMAGE_NAME = "oqcp/mockoon-${env.EXECUTOR_NUMBER}:${BUILD_NUMBER}"
        OQCP_TEST_NETWORK_NAME = "oqcp-test-network-${env.EXECUTOR_NUMBER}-${BUILD_NUMBER}"
        MOCKOON_OQC_CONTAINER_NAME = "mockoon-openqualitychecker-${env.EXECUTOR_NUMBER}-${BUILD_NUMBER}"
        MOCKOON_BB_CONTAINER_NAME = "mockoon-bitbucket-${env.EXECUTOR_NUMBER}-${BUILD_NUMBER}"
    }

    stages {
        stage("Start API mocks") {
            agent any
            
            steps {
                dir('test/Mockoon') {
                    sh "docker build -t ${env.MOCKOON_IMAGE_NAME} ."
                    sh "docker network create --driver bridge ${env.OQCP_TEST_NETWORK_NAME} || true"
                    sh """
                        docker run -d --name ${env.MOCKOON_OQC_CONTAINER_NAME} --rm \
                            --network=${env.OQCP_TEST_NETWORK_NAME} \
                            --hostname=mockoon-openqualitychecker \
                            ${env.MOCKOON_IMAGE_NAME} \
                            -d data -n "OpenQualityChecker" -p 3000
                        """
                    sh """
                        docker run -d --name ${env.MOCKOON_BB_CONTAINER_NAME} --rm \
                            --network=${env.OQCP_TEST_NETWORK_NAME} \
                            --hostname=mockoon-bitbucket \
                            ${env.MOCKOON_IMAGE_NAME} \
                            -d data -n "BitBucket" -p 3000
                       """
                }
            }
        }

        stage('Test components') {
            matrix {
                agent {
                    docker {
                        image 'node:14-alpine'
                        args "-u root --network=${env.OQCP_TEST_NETWORK_NAME}"
                    }
                }
                axes {
                    axis {
                        name 'COMPONENT'
                        values 'backend', 'web'
                    }
                }
                stages {
                    stage('Test') {
                        steps {
                            dir("${COMPONENT}") {
                                // be careful with hard coded path, but it helps accelerate build time (see in Dockerfile)
                                sh 'yarn install --production=false'
                                sh 'yarn test-ci'
                            }
                        }
                    }
                }
                post {
                    always {
                        dir("${COMPONENT}") {
                            junit 'junit.xml' 
                        }
                    }
                }
            }
            
        }
        stage('Deliver components') {
            when {
                branch 'master'
            }
            matrix {
                agent any
                axes {
                    axis {
                        name 'COMPONENT'
                        values 'backend', 'web', 'proxy'
                    }
                }
                environment {
                    // because we named docker image as frontend but the folder is named web
                    DOCKER_IMAGE_NAME = "${env.COMPONENT == 'web' ? 'frontend' : env.COMPONENT}"
                }
                stages {
                    stage('Deliver') {
                        steps {
                            dir("${COMPONENT}") {
                                script {
                                    bitbucketBackend = docker.build "oqcp/bitbucket-${env.DOCKER_IMAGE_NAME}"
                                    docker.withRegistry('https://repo.minhiriathaen.com/repository/docker-private', 'minhiriathaen-repo') {
                                        bitbucketBackend.push("$BUILD_NUMBER")
                                        bitbucketBackend.push('latest')
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        stage('Deploy to Test') {
            when {
                branch 'master'
            }
            agent any
            steps {
                sh 'echo "" >> test.env'
                sh 'echo "TAG=$BUILD_NUMBER" >> test.env'
                script {
                    sshPublisher(
                            publishers: [
                                    sshPublisherDesc(
                                            configName: 'oqcp-test-infra',
                                            verbose: true,
                                            transfers: [
                                                    sshTransfer(
                                                            remoteDirectory: 'bitbucket',
                                                            sourceFiles: 'docker-compose.yml, docker-compose-test.yml, test.env, container.test.env',
                                                            execCommand:
                                                                    '''
                                            cd bitbucket &&
                                            docker login -u ci -p PassWord1234 repo.minhiriathaen.com &&
                                            docker-compose -f docker-compose.yml -f docker-compose-test.yml --env-file test.env pull &&
                                            docker-compose -f docker-compose.yml -f docker-compose-test.yml --env-file test.env up -d --no-build &&
                                            docker ps --filter "label=com.docker.compose.project=oqcp-bitbucket-test" &&
                                            docker image prune -a -f
                                            '''
                                                    )
                                            ]
                                    )
                            ]
                    )
                }
            }
        }
    }

    post {
        always {
            sh "docker rm -vf ${env.MOCKOON_OQC_CONTAINER_NAME} ${env.MOCKOON_BB_CONTAINER_NAME} || true"
            sh "docker network rm ${env.OQCP_TEST_NETWORK_NAME} || true"
            sh "docker rmi -f ${MOCKOON_IMAGE_NAME} || true"
        }
    }
}
