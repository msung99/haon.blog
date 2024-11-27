---
title: 어노테이션 기반 Spring MVC 프레임워크 구현하기
date: "2024-11-12"
tags:
  - MVC
  - 스프링
previewImage: spring.png
series: HTTP 웹서버 Spring MVC 프레임워크 구현하기
---

> 진행한 실습 코드 PR 은 [PR : 어노테이션 기반 MVC 프레임워크 구현하기](https://github.com/Durable-developers/10-jang/pull/1/files) 에서 확인 가능하다.

## 지난 레거시 MVC 프레임워크의 문제점

지난 [AJAX 기반 레거시 MVC 프레임워크 구현하기](https://haon.blog/spring/ajax-based-mvc-impementation/)
에선 AJAX 에 기반한 모방 MVC 프레임워크를 구현했지만 아쉽게도 문제점이 여럿 존재한다.

우선 새로운 컨트롤러가 추가될 때 마다 **(1) 매번 RequestMapping 클래스에 요청 URL 과 컨트롤러를 추가**줘야 한다. 꽤 번거롭고 귀찮은 작업이 발생한다. 유지보수 관점에서도 생각해본다면 컨트롤러 수가 100개가 넘어가기 만 해도 관리하기가 힘들어진다. 또한 각 컨트롤러의 `execute()` 매소드엔 10줄이 넘어가는 경우가 거의 없다. 새로운 기능이 추가될 때 마다 매번 **컨트롤러 오브젝트를 추가하는 것이 아닌, 메소드를 추가하는 방식으로 개선**되면 좋을 것이다. 또한 **(2) 요청 URL 을 매핑할 때 HTTP 메소드도 매핑에 활용할 수 있다면 좋을 것이다.** HTTP 메소드에 대한 지원이 가능하다면 URL 은 같지만 다른 메소드로 매핑하는 것도 가능할 것이다.

이번 학습의 목적은 지난 MVC 프레임워크을 점진적으로 리팩토링 하면서, 어노테이션에 기반한 새로운 NVC 프레임워크로 개선하는 것이 주 목적이다.

---

## 기본 어노테이션 및 클래스

### @Controller, @RequestMapping

기본적인 어노테이션은 아래와 같이 제공되고 있다. 특히 RequestMethod 는 GET, POST, PUT, ... 등을 값으로 가지는 enum 클래스이다.

```java
// RequestMapping.java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequestMapping {
  String value() default "";

  RequestMethod method() default RequestMethod.GET;
}

// Controller.java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface Controller {
  String value() default "";
}
```

### RequestMethod

```java
public enum RequestMethod {
  GET, POST, // ...
}
```

---

## @Controller 어노테이션 설정 클래스 스캔

어노테이션 기반으로 MVC 프레임워크를 구현하려면 먼저 `@Controller` 어노테이션 설정이 되어있는 클래스를 찾아야한다. 자바 reflection 라이브러리를 활용해 클래스 목록을 찾고, 각 클래스에 대한 인스턴스 목록까지 구현한다.

### ControllerScanner

```java
public class ControllerScanner {
    private static final Logger log = LoggerFactory.getLogger(ControllerScanner.class);
    private Reflections reflections;

    public ControllerScanner(Object... basePackage) {
        reflections = new Reflections(basePackage);
    }

    public Map<Class<?>, Object> getControllers() throws InstantiationException, IllegalAccessException {
        Set<Class<?>> preInitiatedControllers = reflections.getTypesAnnotatedWith(Controller.class);
        return instantiateControllers(preInitiatedControllers);
    }

    Map<Class<?>, Object> instantiateControllers(Set<Class<?>> preInitiatedControlllers)
            throws InstantiationException, IllegalAccessException {
        Map<Class<?>, Object> controllers = Maps.newHashMap();
        try {
            for(Class<?> clazz : preInitiatedControlllers) {
                controllers.put(clazz, clazz.newInstance());
            }
        } catch (InstantiationException | IllegalAccessException e) {
            log.error(e.getMessage());
        }
        return controllers;
    }
}
```

---

## @RequestMapping 어노테이션 설정을 활용한 매핑

앞서 ControllerScanner 와 자바 리플랙션을 통해 찾아낸 컨트롤러 클래스를 찾아냈을 것이다. 찾아낸 컨트롤러 클래스 내부의 @RequestMapping 어노테이션 설정을 기반으로 매핑을 해야한다. 매핑을 이전 MVC 프레임워크와 같이 Map 을 활용한다.

### HandlerKey

새로운 MVC 프레임워크 버전에서 다른점은 Map 의 Key 로 사용되는 값이 요청 URL 과 더붙어 HTTP 메소드 조합으로 구성되어야 한다는 것이다. **요청 URL 과 HTTP 메소드 정보를 가지는 클래스를 HandlerKey 라는 이름으로 구현했다.**

```java
public class HandlerKey {
    private String url; // 요청 URL
    private RequestMethod requestMethod; // HTTP 메소드 정보

    public HandlerKey(String url, RequestMethod requestMethod) {
        this.url = url;
        this.requestMethod = requestMethod;
    }

    @Override
    public String toString() {
        return "HandlerKey [url=" + url + ", requestMethod=" + requestMethod + "]";
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((requestMethod == null) ? 0 : requestMethod.hashCode());
        result = prime * result + ((url == null) ? 0 : url.hashCode());
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        HandlerKey other = (HandlerKey) obj;
        if (requestMethod != other.requestMethod)
            return false;
        if (url == null) {
            if (other.url != null)
                return false;
        } else if (!url.equals(other.url))
            return false;
        return true;
    }
}
```

HashMap 의 Key 값으로 활용하기 위해 위 HandlerKey 오브젝트를 `hashCode()`, `equals()` 를 재정의하여 동등성을 보장해줬다.

### HandlerExecution

한편 Map 의 Value 값으로는 `@RequestMapping` 어노테이션이 설정되어 있는 메소드 정보를 가져야한다. 값에 저장되는 메소스 정보는 자바 리플렉션으로 해당 메소드를 실행할 수 있는 정보를 가져야한다. **즉, 메소드가 위치하는 클래스의 인스턴스 정보와 java.lang.reflect.Method 정보를 가지고 있어야한다.** 이 정보를 가지는 클래스를 `HandlerExecution` 이라는 이름으로 아래와 같이 구현했다.

```java
public class HandlerExecution {
  public static final Logger logger = LoggerFactory.getLogger(HandlerExecution.class);
  private Object declaredObject; // 메소드가 위치하는 클래스의 인스턴스 정보
  private Method method;  // Method 정보

  public HandlerExecution(Object declaredObject, Method method) {
    this.declaredObject = declaredObject;
    this.method = method;
  }

  public ModelAndView handle(HttpServletRequest request, HttpServletResponse response) throws Exception {
    try {
        return (ModelAndView) method.invoke(declaredObject, request, response);
    } catch (IllegalAccessExcpetion | IllegalArgumentException e) {
        logger.error("{} method invoke fail. Error message : {}", method, e.getMessage());
        throw new RunTimeException(e);
    }
  }
}
```

### AnnotationHandlerMapping

Map 에서 사용할 key 와 value 에 대한 클래스인 HandlerKey, HandlerExecution 의 구현을 완료했다. HandlerKey 와 HandlerExecution 을 연결해야 한다. HandlerKey, HandlerExecution 이들에 대한 `매핑 초기화 작업` 을 AnnotationHandlerMapping 클래스를 추가해 구현했다.

```java
public class AnnotationHandlerMapping {
  private static final Logger logger = LoggerFactory.getLogger(AnnotationHandlerMapping.class);
  private Object[] basePackage;
  private Map<HandlerKey, HandlerExecution> handlerExecutions = Maps.newHashMap();

  public AnnotationHandlerMapping(Object... basePackage) {
    this.basePackage = basePackage;
  }

  public void initalize() {
    ControllerScanner controllerScanner = new ControllerScanner(basePackage);
    Map<Class<?>, Object> cotnrollers = controllerScanner.getControllers();
    Set<Method> methods = getRequestMappingMethods(controllers.keySet());
    for(Method method : methods) {
        RequestMapping rm = method.getAnnotation(RequestMapping.class);
        logger.debud("register handlerExecution : url is {}, method is {}", rm.value()., method);
        handlerExecutions.put(createHandlerKey(rm), new HandlerExecution(controllers.get(method.getDeclaringClass()), method));
    }
  }

  private HandlerKey createHandlerKey(RequestMappign rm) {
    return new HandlerKey(rm.value(), rm.method());
  }

  @SuppressWarnings("unchecked")
  private Set<Method> getRequestMappingMethods(Set<Class<?>> controllers) {
    Set<Method> requestMappingMethods = Sets.newHashSet();
    for(Class<?> clazz : controllers) {
        requestMappingMethods.addAll(ReflectionUtils.getAllMethods(clazz, ReflectionUtils.withAnnotataion(RequestMapping.class)));
    }
    return requestMappingMethods;
  }

  // 클라이언트 요청에 해당하는 HandlerExecution 을 조회하는 매소드
  public HandlerExecution getHandler(HttpServletRequest request) {
    String requestUri = request.getRequestURI();
    RequestMethod rm = RequestMethod.valueOf(request.getMethod().toUpperCase());
    logger.debug("reqeustUri: {}, requestMethod: {}", requestUri, rm);
    return handlerExecutions.get(new HandlerKey(requestUri, rm));
  }
}
```

---

## DispatcherServlet 과 AnnotationHandlerMapping 통합

지금까지 앞선 구현을 통해 어노테이션 기반으로 컨트롤러 설정이 가능하도록 구현했다. 이젠 DispacherServlet 에서 새롭게 추가한 AnnotationHandlerMapping 을 활용해 서비스가 가능하도록 통합해야한다. 그런데 DispatcherServlet 기존 코드에는 컨트롤러를 RequestMapping 클래스로 정보를 담고있다. 즉 DispatcherServlet 은 이전까지 레거시 MVC 프레임워크의 매핑 정보를 담고있는 `RequestMapping` 과, 현재 어노테이션 기반으로 매핑 정보를 담고있는 `AnnotationHandlerMapping` 의 오브젝트를 모두 필드로 가지고, 지원해야한다.

RequestMapping 과 AnnotationHandlerMapping 을 모두 지원하기 위해 둘을 각각 분리해서 관리할 수도 있겠지만, 둘을 일관된 인터페이스로 통합한 후 관리하는 것이 확장성 측면에서 유리하다. 이 2가지 매핑 클래스에 대해 추상화한 공용 인터페이스를 `HandlerMapping` 이라는 이름으로 추가했다. 즉, RequestMapping 과 AnnotationHandlerMapping 클래스가 HandlerMapping 인터페이스를 구현한다.

```java
public interface HandlerMapping {
  Object getHandler(HttpServletRequest request);
}
```

### LegacyRequestMapping

또한 기존 RequestMapping 클래스의 이름을 `LegacyRequestMapping` 으로 이름을 변경했다.

```java
public class LegacyHandlerMapping implements HandlerMapping {
  private Map<String, Controller> mappings = new HashMap<>();

   void initMapping() {
      // ...
   }

   @Override
   public Controller getHandler(HttpServletRequest request) {
     return mappings.get(request.getRequestURI());
   }
}
```

### DispatcherServlet 리팩토링

DispatcherServlet 이 HandlerMapping 인터페이스의 구현체 2가지 타입인 LegacyHandlerMapping, AnnotationHandlerMapping 에 대해 모두 동작(호환) 되도록 개선했다. 초기화가 끝난 HandlerMapping 을 List 로 관라하면서 요청 URL 과 HTTP 메소드에 해당하는 컨트롤러를 찾아 컨트롤러가 존재할 경우 컨트롤러에게 작업을 위임하도록 구현했다.

```java
@WebServlet(name = "dispatcher", urlPatterns = "/", loadOnStartUp = 1)
public class DispacherServlet extends HttpServlet {
  private static final Logger logger = LoggerFactory.getLogger(DispacherServlet.class);
  private List<HandlerMapping> mappings = Lists.newArrayList();

  @Override
  public void init() throws ServletException {
    LegacyHandlerMapping lhm = new LegacyHandlerMapping();
    lhm.initMapping();
    AnnotationHandlerMapping ahm = AnnotationHandlerMapping("next.controller");

    ahm.initalize();
    mappings.add(lhm);
    mappings.add(ahm);
  }

  @Override
  protected void service(HttpServletRequest req, HttpServletRespisnoe resp) throws ServletException, IOException {
    Object handler = getHandler(req);
    if(handler == null) {
      throw new IllegalArgumentExcpetion("존재하지 않는 URL입니다.");
    }

    try {
      ModelAndView mav = execute(handler, req, resp);
      View view = mav.getView();
      view.render(mav.getModel(), req, resp);
    } catch (Throwable e) {
      logger.error("Exception : {}", e);
      throw new ServletException(e.getMessage());
    }
  }

  private Object getHandler(HttpServletRequest req) {
    for(HandlerMapping handlerMapping : mappings) {
      Object handler = handlerMapping.getHandler(req);
      if(handler != null) {
        return handler;
      }
    }
    return null;
  }

  private ModelAndView execurte(Object handler, HttpServletRequest req, HttpServletResponse resp) throws Exception {
    if(handler instanceof Controller) {
      return ((Contoller)handler).executea(req, resp);
    } else {
      return ((HandlerExecution)handler).handler(req, resp);
    }
  }
}
```

---

## @Controller 어노테이션 활용

모든 작업이 끝났다. 이제 테스트 컨트롤러를 생성한 후 아래와 같이 @Controller 어노테이션을 명시하면 원활히 동작할 것이다.
앞서 코드 구현을 통해 기존 컨트롤러에 대한 지원도 가능하면서 새롭게 추가한 AnnotationHandlerMapping 도 지원하므로 호환성이 유리한 MVC 프래임워크가 되었다.

```java
@Controller
public class TestController {

    @RequestMapping(value = "/get-test", method = RequestMethod.GET)
    public ModelAndView findUserId(HttpServletRequest request, HttpServletResponse response) {
        // ...
        return modelAndView;
    }

    @RequestMapping(value = "/post-test", method = RequestMethod.POST)
    public ModelAndView save(HttpServletRequest request, HttpServletResponse response) {
        // ...
        return modelAndView;
    }
}
```

---

## 마치며

이렇게 어노테이션 기반 Spring MVC 를 모방한 프레임워크를 구현할 수 있었다. 스프링부트 프레임워크의 내부 동작원리를 깊게 이해할 수 있었던 가장 유익한 학습거리가 되었다! 지금까지 학습해왔던 내용들중에 가장 큰 배움이 있었던 미션이지 않나 싶다. 기존 레거시 코드에 대한 처리, 점진적인 리팩토링 과정하는 과정이 꽤 어려웠지만, MVC 프레임워크를 직접 구현해보니 덕분에 이해도가 훨씬 높아졌다.

다만, 아직 DI 컨테이너 직접 구현하기에 대한 미션이 남아있다. 어서 진행해보고 싶은 마음이다. DI 컨테이너를 구현한 후, DI 컨테이너와 현재 구현된 Spring MVC 코드를 어서 통합해봐야겠다 🙂

---

## 더 학습해야 할 키워드

- 자바 리플렉션 (JAVA Reflection)
