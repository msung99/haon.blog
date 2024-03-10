---
title: AJAX 기반 레거시 MVC 프레임워크 구현하기
date: "2024-02-14"
tags:
  - MVC
  - JSP
  - 스프링
---

> 스터디를 진행하면서 알게된 학습 내용, 고민 사항을 정리했다.

---

## MVC 패턴, JSP

MVC 패턴이 등장하기 이전까지만 해도 대부분의 로직은 JSP 에 모두 담겨있었다. JSP 에 상당 로직을 포함하는 것이 초기 개발 속도는 빠를진 몰라도 유지보수 비용은 상당했다.

MVC 패턴을 적용할 경우 기존 JSP 만이 존재할 때와 다른점은, JSP 의 역할은 단순히 컨트롤러로부터 전달된 데이터를 단순히 출력하는 로직만을 포함하고 있다는 점이다. 대부분의 로직은 컨트롤러와 모델이 담당하고 있고, JSP 는 단순 뷰의 로직만을 수행하면 된다.

---

## 1단계. DispatcherSevlet 기반 MVC 프레임워크 구현

우선 기본적인 MVC 프레임워크 1단계를 진행했다. 지난 실습에선 RequestHandler 에서 모든 요청을 받고 요청 URL 에 따라 분기 처리해줬는데, 이를 서블릿으로 변경한다. 즉 `DispatcherServlet` 서블릿을 구현하하고, 이 하나의 서블릿이 모든 요청을 받고 요청 URL 에 따라 분리 처리하도록 구현했다.

### Controller

우선 클라이언트 요청에 대한 처리를 담당하는 부분인 컨트롤러를 추상화했다. `execute()` 에서 리다이렉트 방식으로 이동할 경우 `redirect:` 로 시작하고 forward 방식으로 이동할 경우 JSP 를 반환하도록 구현했다.

```java
public interface Controller {
  String execute(HttpServletRequest request, HttpServletResponse response) throws Excpetion;
}
```

### Controller 구현체

Controller 를 구현한 컨트롤러 구현체 중 하나다. 이렇게 생성된 여러 컨트톨러 오브젝트들은 이후 살펴볼 `RequestMapping` 에서 서비스에서 발생하는 모든 요청 URL 과 각 URL 에 대한 서비스를 담당할 컨트롤러가 매핑된다.

```java
public class ListUserController implements Controller {
  @Override
  public String execute(HttpServletRequest request, HttpServletResponse response) throws Exception {
    if(isLogined(request.getSession())) {
      return "redirect:/users/loginForm";
    }
    req.setAttribute("users", Database.findAll());
    return "/item/list.jsp";
  }

  private boolean isLogined(HttpSession session) {
    // ...
  }
}
```

### RequestMapping

앞서 언급한 RequestMapping 이다. RequestMapping 은 서비스에서 발생하는 모든 요청 URL 과 각 URL 에 해당 서비스를 담당할 컨트롤러를 연결하는 작업을 담당한다.

```java
public class RequestMapping {
  private static final Logger logger = LoggerFactory.getLogger(DispatcherServlet.class);
  private Map<String, Controller> mappings = new HashMap<>();

  void initMapping() {
    mappings.put("/", new HomeController());
    mappings.put("/users/form", new ForwardController());
    mappings.put("/users/profile", new ProfileController());
    // ...
  }

  public Controller findController(String url) {
	return mappings.get(url);
  }

  void put(String url, Controller controller) {
    mappings.put(url, controller);
  }
}
```

### DispatcherServlet

마지막으로 구현할 부분은 클라이언트의 모든 요청을 받아 URL 에 해당하는 컨트롤러로 작업을 위임하고, 실행된 결과 페이지로 이동하는 작업을 담당하는 `DispatcherServlet` 를 구현했다. 각 요청 URL 에 대한 매핑 컨트롤러 정보는 ReqeustMapping 필드를 통해 보유하고 있다.

유심해서 볼 부분은 DispatcherServlet 을 `프론트 컨트롤러 패턴` 을 활용하여 구현했다는 점이다. `move()` 메소드를 보면 각 서블릿에서 서블릿과 JSP 사이를 이동하기 위해 모든 중복 코드를 이곳에서 담당하고 있으며, 이를 프론트 컨트롤러 패턴이라고 한다. DispatcherServlet 은 모든 컨트롤러 앞단에서 모든 요청을 가장 먼저 받아 각 컨트롤러에게 작업을 위임한다.

```java
@WebServlet(name = "dispatcher", urlPatterns = "/", loadOnStartUup = 1)
public class DispatcherServlet extends HttpServlet {
  private static final long serialVersionUID = 1L;
  private static final Logger logger = LoggerFactory.getLogger(DispatcherServlet.class);
  private static final String DEFAULT_REDIRECT_PREFIX = "redirect:";

  private RequestMapping rm;

  @Override
  public void init() throws ServletExcepton {
    rm = new RequestMapping();
    rm.initMapping();
  }

  @Override
  protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOExcpetion {
    String requestUri = rqe.getRequestURI();

    Controller controller = rm.findController(requestUri);
    try {
      String viewName = controller.execute(request, response);
      move(viewName, request, response);
    } catch(Throwable e) {
      logger.error("Exception : {}", e);
      throw new ServletException(e.getMessage());
    }
  }

  private void move(String viewName, HttpServletRequest request, HttpServletResponse response) throws ServletExcpetion, IOException {
    if(viewName.startsWith(DEFAULT_REDIRECT_PREFIX)) {
      resp.sendRedirect(viewName.subString(DEFAULT_REDIRECT_PREFIX.length()));
      return;
    }
    RequestDispatcher rd = req.getRequestDispatcher(viewName);
    rd.forward(request, response);
  }
}
```

---

## 2단계. AJAX 기반 MVC 프레임워크로 개선

위 1단게 구현까지 마쳤다면 그것만으로 훌륭한 구현 코드라고 생각할 수 있으나, 아쉽게도 위 코드는 JSON 데이터를 응답하지 못한다. 즉, SSR 기반 HTML 정적 데이터 타입만을 응답하도록 구현된 코드이다. 따라서 HTML, JSON 2가지 형태를 모두 응답하는 MVC 프레임워크로 개선해보았다.

### 기존 Coneroller 의 문제점

앞서 보여줬던 컨트롤러 구현체중 하나다. 이 컨트롤러 구현체 하나만 놓고 본다면 썩 문제점이 발생하지 않을 것 같고, 기존 MVC 프레임워크 코드만으로도 원활히 동작할 것 으로 보인다.

```java
public class ListUserController implements Controller {
  @Override
  public String execute(HttpServletRequest request, HttpServletResponse response) throws Exception {
    if(isLogined(request.getSession())) {
      return "redirect:/users/loginForm";
    }
    req.setAttribute("users", Database.findAll());
    return "/item/list.jsp";
  }

  private boolean isLogined(HttpSession session) {
    // ...
  }
}
```

하지만 아래 컨트롤러를 보면 2가지의 문제점을 가지고있다. 우선 JSON 으로 응답을 보내는 경우 이동할 JSP 페이지가 없으니 불필요하게 null 을 리턴하고 있다. AJAX 에서 사용할 컨트롤러를 리턴값이 굳이 필요없다. 이 문제가 발생한 원인은, 기존과 달리 컨트롤러에서 응답할 뷰 타입이 JSP 하나에서 JSP, JSON 2가지로 늘어났기 떄문이다.

또한 자바 객체를 JSON 으로 변환하고 응답하는 부분에서 중복이 발생한다. 중복 코드를 최소화할 필요가 있다.

```java
public class DeleteAnswerController implements Controller {
  @Override
  public String execute(HttpServletRequest request, HttpServletResponse response) {
    Long answerId = Long.parseLong(req.getParameter("answerId"));
    AnswerDao answerDao = new AnswerDao();
    answerDao.delete(answerId);

    ObjectMapper mapper = new ObjectMapper();
    response.setContentType("application/json;charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.print(mapper.writeValueAsString(Result.ok()));
    return null; // 불필요하게 null 을 리턴
  }
}
```

### ModelAndView

위 2가지 문제점을 해결할 수 있는것은 바로 `ModelAndView` 라는 추상화 클래스를 만드는 방법에 있었다. 이 클래스는 `(1)` 기존에는 JSP 뷰 타입만을 리턴했다면, 이젠 다른 종류의 뷰인 JSON 도 응답할 수 있도록 기능을 제공한다. 또한 `(2)` 컨트롤러의 `exetute()` 메소드에서 HttpServletRequest 타입으로 전달되는 모델 데이터를 별도의 Map 을 활용해 타입을 변환하여 전달하도록 한다.

여기서 `(2)` 를 해야하는 이유가 있다. 만약 ModelAndView 에 Map 으로 변환하는 코드가 없는 경우라면, HttpServletRequest 에 추가되어 있는 모든 데이터를 JSON 으로 변경한다. 그런데 HttpServletRequest 의 경우 서블릿 필터, 서블릿의 여러 단계를 거치면서 개발자가 모르는 상태에서 추가 데이터가 발생할 수 있다. 이 경우 개발자가 의도치 않게 불필요한 데이터가 모두 JSON 으로 변환되어 클라이언트 응답으로 보내질 수 있으므로, HttpServletRequest 를 통해 데이터를 전달하지 않고 개발자가 원하는 데이터만 정확하게 뷰에 전달할 수 있도록 모델 데이터에 대한 추상화 작업을 진행해야 하는 것이다.

이로써 뷰를 포함해 모델 데이터에 대한 추상화를 담당하는 클래스인 ModelAndView 를 따로 분리시켰다.

```java
public class ModelAndView {
  private View view;
  private Map<String, Object> model = new HashMap<>();

  public ModelAndView(View view) {
    this.view = view;
  }

  public ModelAndView addObject(String attributeName, Object attributeValue) {
    model.put(attributeName, attributeValue);
    return this;
  }

  public Map<String, Object> getModel() {
    return Collections.unmodifiableMap(model);
  }

  public View getView() {
    return view;
  }
}
```

### View

ModelAndView 를 보면 View 타입 필드가 있는것을 볼 수 있다. JSP 와 JSON 뷰를 추상화 한 것이다. 이 인터페이스의 구현체로 `JspView`, `JsonView` 를 만들었다. 간단한 if-else 분기 처리로 뷰 타입에 따른 로직을 수행하지 않고 따로 클래스로 분리시킴으로써 다양한 뷰 타입에 대한 유연한 확장을 가능하도록 했다. JSP, JSON 외의 신규 뷰 타입이 추가될 경우 추가 View 구현 클래스를 만들면 된다.

또한 `render()` 메소드를 보면 모델 데이터를 파라미터로 전달할 수 있도록 했다.

```java
public interface View {
  void render(Map<String, ?> model, HttpServletRequest request, HttpServletResposne response) throws Exception;
}
```

### JspView

JSP 에 대한 페이지 이동 처리를 담당한다. 이동할 뷰 이름을 생성자로 받은 후, `render()` 메소드를 호출 시 해당 페이지로 이동하도록 했다. 이 부분은 기존의 `DispatcherServlet` 의 `move()` 메소드 구현 부분을 `render()` 메소드 내에다 옮겼다.

```java
public class JspView implements View {
  private static final String DEFAULT_REDIRECT_PREFIX = "redirect:";
  private String viewName;

  public JspView(String viewName) {
    if(viewName == null) {
      throw new NullPointerExcpetion("viewName is null. 이동할 URL 을 입력해주세요.");
    }
    this.viewName = viewName;
  }

  @Override
  void render(Map<String, ?> model, HttpServletRequest request, HttpServletResponse response) throws Exception {
    if(viewName.startsWith(DEFAULT_REDIRECT_PREFIX)) {
      response.sendRedirect(viewName.substring(DEFAULT_REDIRECT_PREFIX.length()));
      return;
    }

    Set<String> keys = model.keySet();
    for(String key : keys) {
      request.setAttribute(key, model.get(key));
    }

    RequestDispatcher rd = request.getRequestDispatcher(viewName);
	rd.forward(request, response);
  }
}
```

### JsonView

JSON 데이터 응답을 담당할 View 이다. 이동할 URL 이 없기 떄문에, `render()` 메소드는 HttpServletRequest 를 통해 전달되는 자바 객체를 JSON 으로 변환한 후 응답하는 기능을 가지도록 구현했다.

```java
public class JsonView implements View {
  @Override
  public void redner(Map<String, ?> model, HttpServletRequest request, HttpServletResponse response) throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    response.setContentType("application/json;charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.print(mapper.writeValueAsString(model));
  }
}
```

### Controller 리팩토링

컨트롤러가 이젠 JSP 외에 JSON 타입도 지원해야 하므로, 기존에 String 타입을 리턴했던 코드를 ModelAndView 를 리턴하도록 개선했다.

```java
public interface Controller {
    ModelAndView execute(HttpServletRequest req, HttpServletResponse resp) throws Exception;
}
```

### AbstractController

ModelAndView 생성을 더 쉽도록 돕기 위한 추상 클래스다.

```java
public abstract class AbstractController implements Controller {
  protected ModelAndView jspView(String forwardUrl) {
    return new ModelAndView(new JspView(forwardUrl));
  }

  protected ModelAndView jsonView() {
    return new ModelAndView(new JsonView());
  }
}
```

### Controller 구현 클래스

기존에 Controller 인터페이스를 구현했던 구체 컨트롤러를 이젠 AbstractController 를 상속하도록 개선했다. AbstractController 메소드인 `jsonView()` 를 통해 손쉽게 ModelView 오브젝트를 리턴하는 것을 볼 수 있다.

```java
public class AddAnswerController extends AbstractController {
    private static final Logger log = LoggerFactory.getLogger(AddAnswerController.class);

    @Override
    public ModelAndView execute(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        Answer answer = new Answer(req.getParameter("writer"), req.getParameter("contents"),
                Long.parseLong(req.getParameter("questionId")));
        log.debug("answer : {}", answer);

        AnswerDao answerDao = new AnswerDao();
        Answer savedAnswer = answerDao.insert(answer);
        resp.setContentType("application/json;charset=UTF-8");
        return jsonView().addObject("answer", savedAnswer);
    }
}
```

### DispatcherServlet 리팩토링

마지막 작업으로 DispatcherServlet 이 JSP 뷰 타입만을 지원하기 위해 String 을 리턴했다면, 이젠 ModelAndView 뷰 타입을 리턴하도록 개선했다.

```java
@WebServlet(name = "dispatcher", urlPatterns = "/", loadOnStartup = 1)
public class DispatcherServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(DispatcherServlet.class);
    private static final String DEFAULT_REDIRECT_PREFIX = "redirect:";

    private RequestMapping rm;

    @Override
    public void init() throws ServletException {
        rm = new RequestMapping();
        rm.initMapping();
    }

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String requestUri = req.getRequestURI();
        logger.debug("Method : {}, Request URI : {}", req.getMethod(), requestUri);

        Controller controller = rm.findController(requestUri);
        ModelAndView modelAndView;
        try {
            modelAndView = controller.execute(req, resp);
            View view = modelAndView.getView();
            view.render(modelAndView.getModel(), req, resp);
        } catch (Throwable e) {
            logger.error("Exception : {}", e);
            throw new ServletException(e.getMessage());
        }
    }

    private void move(String viewName, HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        if (viewName.startsWith(DEFAULT_REDIRECT_PREFIX)) {
            resp.sendRedirect(viewName.substring(DEFAULT_REDIRECT_PREFIX.length()));
            return;
        }

        RequestDispatcher rd = req.getRequestDispatcher(viewName);
        rd.forward(req, resp);
    }
}
```

---

## 마치며

이로써 다양한 뷰 타입을 지원할 수 있는 MVC 프레임워크를 구현해봤다. 아직 100% 소화된 느낌은 아니기에, 조금 더 추가 학습을 해봐야겠다 🙂

다음은 어노테이션 기반 MVC 프레임워크를 구현한 내용에 대해 다루고자 한다.
