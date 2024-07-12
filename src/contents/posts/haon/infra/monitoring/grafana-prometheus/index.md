---
title: Grafana, Prometheus, SpringBoot Actuator 기반 모니터링 환경 구축하기
date: "2023-06-24"
tags:
  - Grafana
  - Prometheus
  - 모니터링
previewImage: infra.png
---

> 서비스를 운영시, 항상 모니터링(경계)의 주시와 대응은 필수이다.

## 모너티링 구축 배경

![](https://velog.velcdn.com/images/msung99/post/da83ebcc-e772-4e81-9f47-01b5eecf6499/image.png)

현재 운영중인 서비스에서 최근들어 기존의 2배 인원인 `약 4000명의 신규 유저가 유입` 되었습니다. 이런 갑작스러운 변화에 모니터링 환경을 구축해야함을 필수임을 인지하고, 인프라 아키텍처에 모니터링을 도입하고자 이렇게 학습하고자 합니다.

## Micrometer 추상화

사실 모너터링 툴은 `Prometheus` 외에도 굉장히 다양합니다. 저도 지금 직접 모니터링 환경을 구축하면서 느끼듯이, 모든 개발자 및 인프라팀은 상황 및 기호에 따라 다양한 모너터링 툴을 변경해야는 상황이 발생하는데, `마이크로미터` 가 `추상화`를 제공하여 다양한 모너터링 구현체를 지원합니다. 개발자는 마이크로미터가 정한 표준 방법으로 `메트릭(측정 지표)` 를 전달하고, 사용하는 모너터링 툴에 알맞는 구현체 (여기선 프로메테우스) 를 선택하면 됩니다.

---

## 메트릭(Metric) 수집 아키텍처

![](https://velog.velcdn.com/images/msung99/post/1ea9e7c3-aca0-4ed2-9c35-1b475fd52267/image.png)

Spring Actuator 는 마이크로미터가 수집하는 CPU, JVM, 커넥션등의 수많은 `메트릭(지표)` 를 편리하게 사용할 수 있는 기능을 제공해줍니다. 지금부터 알아볼 Actuaor, Grafana, Prometheus 의 기능을 요약해보면 다음과 같습니다.

- Spring Actuator : 메트릭 정보를 쉽게 수집할 수 있게 정보를 제공
- Prometheus : 마이크로미터로 부터 주기적으로 메트릭 정보를 PULL 받아서 저장
- Grafana : 프로메테우스가 수집한 정보를 활용하여 사용자에게 보기좋은 정보를 제공해주는 DashBoard

SpringBoot Actuator 와 마이크로부터로 부터 메트릭 정보가 자동으로 생성되며, 프로메테우스 구현체가 읽을 수 있는 메트릭 포맷으로 변환됩니다. 그러면 프로메테우스는 일정 주기로 메트릭을 주기적으로 수집해서, 수집한 메트릭을 내부 DB 에 저장합니다. 그러면 그라파냐 데시보드를 통해 프로메테우스에 수집된 메트릭 수집정보를 시각자료로써 손쉽게 조회 가능합니다.

---

## Spring Actuator

그럼 지금부터 메트릭 수집 환경을 구축해봅시다. 우선 엑츄에이터의 의존성을 추가해줍시다.

```java
implementation 'org.springframework.boot:spring-boot-starter-actuator'
```

### Actuator 엔드포인트

라이브러를 추가한뒤 서버를 실행시키고 `/actuator` 로 접속해보면 Actuator 가 제공하고 있는 엔드포인트 목록들을 확인할 수 있습니다. 엔드포인트란 쉽게말해 Actuator 를 통헤 애플리케이션의 내부 정보를 외부에 유출시키는 것을 의미합니다.

```java
{
    "_links": {
        "self": {
            "href": "http://localhost:8080/actuator",
            "templated": false
        },
        "health": {
            "href": "http://localhost:8080/actuator/health",
            "templated": false
        },
        "health-path": {
            "href": "http://localhost:8080/actuator/health/{*path}",
            "templated": true
        }
    }
}
```

### 마이크로미터 프로메테우스 구현체

위와 같이 Actuator 가 기본적으로 유출시키는 엔드포인트에 이어서, Prometheus에서 사용되는 메트릭에 대한 엔드포인트도 외부에 유출 시켜야합니다. 이를위해 우선 Prometheus 에 대한 의존성이 필요합니다.

```java
runtimeOnly 'io.micrometer:micrometer-registry-prometheus'
```

위 의존성은 애플리케이션에 `마이크로미터 프로메테우스 구현체` 라이브러를 추가하는 것입니다. 프로메테우스는 JSON 형식의 메트릭 데이터를 이해할 수 없습니다. 따라서 프로메테우스가 이해할 수 있는 메트릭 포맷으로 변경해야하는데, 이 때문에 마이크로미터를 사용해서 프로메테우스가 이해할 수 있는 포맷으로 손쉽게 변형 가능하도록 위 구현체를 활용하는 것입니다.

### Prometheus 엔드포인트 유출

이어서, 아래와 같이 application.yml 파일에 설정을 추가해서 외부에 엔드포인트를 유출시킵니다.

```sql
management:
  endpoint:
    shutdown:
      enabled: true
  endpoints:
    web:
      exposure:
        include: prometheus
```

정상적으로 외부에 유출시켰다면 아래와 같은 결과를 조회할 수 있습니다.

```sql
// ...
"prometheus": {
  "href": "http://localhost:8080/actuator/prometheus",
  "templated": false
}
```

---

## Prometheus

앞선 과정을 통해 actuator 엔트포인트로 프로메테우스가 이해할 수 있는 metric 을 생성하고 있으니, 이제 **프로메테우스가 해당 metric 을 주기적으로 수집할 수 있도록 설정 해보겠습니다.** "prometheus.yaml" 파일을 생성하고 아래와 같이 내용을 구성해줍시다.

```sql
global:
  scrape_interval: 1m   // 기본값:1m (1분)

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ['http://localhost:8080'] // 또는 'host.docker.internal:8080'
        metric_path: '/actuator/prometheus'
```

`scrape_interval` 은 메트릭을 수집할 주기를 명시하는 것으로 위에서는 10초의 주기로 메트릭을 수집하도록 설정했습니다. `job_name` 은 말그대로 job 이름으로 임의의 이름을 사용했으며, `metric_path` 는 메트릭을 수집할 경로로써, 앞서 유출시켰던 엔트포인트를 명시해주었습니다. `targets` 은 메트릭을 수집한 애플리케이션 경로를 명시하는 것입니다.

이때 저는 `host.docker.internal`를 사용하여 도커 인스턴스 내부에서 호스트의 포트에 접속하겠습니다. 로컬이 아닌 환경이라면 이에 맞게 입력하며 됩니다.

### 도커를 이용한 Prometheus 설치

```java
$ docker pull prom/prometheus

docker run \
    -p 9090:9090 \
    -v {%상위경로%}/prometheus.yml:/etc/prometheus/prometheus.yml \
    prom/prometheus
```

{%상위 경로%}에는 위에서 입력한 prometheus.yml의 상위 경로를 작성해줍니다. 이로써 도커 기반의 프로세스 실행에 성공하면 `9090 포트` 로 접속해봅시다. 그러면 아래와 같이 프로메테우스 대시보드를 조회할 수 있게됩니다.

![](https://velog.velcdn.com/images/msung99/post/9c747b61-9258-4231-9737-33838e7884fb/image.png)

프로메테우스가 수집한 여러 메트릭 중 하나를 확인해봅시다. 예를들어 `http_server_requests_seconds_max` 메트릭을 입력하면 아래와 같이 Graph로 시각화하여 메트릭을 조회가 가능합니다.

![](https://velog.velcdn.com/images/msung99/post/c2ed85bf-ce21-4f25-ae35-48406ce9d69d/image.png)

---

## Grafana

앞서 말했듯이, 프로메테우스가 메트릭에 대한 시각화를 제공하지만 그라파나를 이용하여 더욱 강력한 메트릭 시각화 할 수 있습니다.

```java
$ docker pull grafana/grafana
$ docker run --name grafana -d -p 3000:3000 grafana/grafana
```

docker run을 성공적으로 실행하면 `3000번 포트로` 로 그라파나에 접속할 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/fc3550a3-5474-4245-bff3-74cb8454cf8c/image.png)

Grafana에 접속하면, 위와 같은 로그인 페이지에 접속됩니다. 초기 계정은 admin, admin 이고, 처음 로그인하면 비밀번호를 변경하는 창이 나옵니다.

![](https://velog.velcdn.com/images/msung99/post/0f96c89c-b662-4ddd-9e2d-f343402042cb/image.png)

데이터소스 추가를 위해 그라파나 첫 페이지에서 `DATA SOURCE`를 클릭해줍시다. 여기서 앞서 구축했던 프로메테우스를 연동하는 것입니다.

![](https://velog.velcdn.com/images/msung99/post/1e5c42cb-4b76-4469-a331-70009d09e462/image.png)

`Data Source` 이름을 지정해주고, URL에 `http://host.docker.internal:9090/` 를 입력해줍시다. (또는 `http://localhost:9090` 을 입력) Data Source 설정에 성공할 경우 성공을 알리는 녹색 상태창이 나오게됩니다.

![](https://velog.velcdn.com/images/msung99/post/955afa0e-2ba4-482d-8ea7-fd5c82286d72/image.png)

이제 최종적으로 `Import` 를 클릭하여 대시보드를 생성하겠습니다. 스프링부트 메트릭을 보여주는 유명한 대시보드로 `JVM dashboard` 가 있습니다. 몰론 저희가 직접 데시보드를 구성하는 것도 가능하지만, 지금은 유명한 프리셋을 사용하겠습니다. 다양한 대시보드는 Grafana Dashboards에서 확인할 수 있습니다.

![](https://velog.velcdn.com/images/msung99/post/e4d6f4eb-dfdc-4331-8d47-0fad21828082/image.png)

`Import via grafana.com` 에다 `h‘https://grafana.com/grafana/dashboards/4701-jvm-micrometer/’ ` 를 넣어주고 `Load` 를 클릭합시다. 그러고 마지막으로 `Import` 를 클릭하면 아래와 같은 깔끔하고 멋진 데시보드가 조회되는 모습을 확인할 수 있습니다.

### Grafana Dashboard

![](https://velog.velcdn.com/images/msung99/post/a09ed09c-8ee7-4cfb-859c-874af9781758/image.png)

이렇게 멋진 그라파나 대시보드를 만들어보았습니다. 스크린샷보다 더 많은 메트릭이 있으므로 스크롤하여 확인해봐도 좋습니다. 기본 범위는 24시간으로 설정되어있습니다.

---

## 참고

- https://hudi.blog/spring-boot-actuator-prometheus-grafana-set-up/
- https://covenant.tistory.com/244
- https://inma.tistory.com/163
- https://hays99.tistory.com/278
- https://meetup.nhncloud.com/posts/237
- https://lollaziest.tistory.com/186
- https://devnata.tistory.com/147
- https://velog.io/@moey920/안정적인-운영을-완성하는-모니터링.-프로메테우스와-그라파나
