import { constantRoutes } from "@/router";
import Layout from "@/layout/index";
import ParentView from "@/components/ParentView";
import store from "@/store";
import menuJson from "./menu";

const permission = {
  state: {
    routes: [],
    addRoutes: [],
    defaultRoutes: [],
    topbarRouters: [],
    sidebarRouters: []
  },
  mutations: {
    SET_ROUTES: (state, routes) => {
      state.addRoutes = routes;
      state.routes = constantRoutes.concat(routes);
    },
    SET_DEFAULT_ROUTES: (state, routes) => {
      state.defaultRoutes = constantRoutes.concat(routes);
    },
    SET_TOPBAR_ROUTES: (state, routes) => {
      // 顶部导航菜单默认添加统计报表栏指向首页
      const index = {
        name: "Dashboard",
        path: "/dashboard",
        hidden: false,
        redirect: "noRedirect",
        component: "Layout",
        alwaysShow: true,
        meta: { title: "", icon: "", noCache: true }
      };
      routes.unshift(index);
      state.topbarRouters = routes;
    },
    SET_SIDEBAR_ROUTERS: (state, routes) => {
      state.sidebarRouters = routes;
    }
  },
  actions: {
    // 生成路由
    GenerateRoutes({ commit }) {
      return new Promise(resolve => {
        // const sdata = JSON.parse(JSON.stringify(menuJson));
        // const rdata = JSON.parse(JSON.stringify(menuJson));
        const sdata = JSON.parse(JSON.stringify(store.getters.menus));
        const rdata = JSON.parse(JSON.stringify(store.getters.menus));

        cacheTopClick(sdata);
        const sidebarRoutes = filterAsyncRouter(sdata);
        const rewriteRoutes = filterAsyncRouter(rdata, false, true);
        rewriteRoutes.push({ path: "*", redirect: "/404", hidden: true });

        commit("SET_ROUTES", rewriteRoutes);
        commit("SET_SIDEBAR_ROUTERS", constantRoutes.concat(sidebarRoutes));
        commit("SET_DEFAULT_ROUTES", sidebarRoutes);
        commit("SET_TOPBAR_ROUTES", sidebarRoutes);
        resolve(rewriteRoutes);
      });
    }
  }
};

//缓存头部菜单点击记录
function cacheTopClick(data) {
  let obj = {};
  if (data.length > 0) {
    data.map(route => {
      if (route.component === "Layout" && route.name !== "Dashboard") {
        obj[route.name] = "";
      }
    });
    sessionStorage.setItem("topCache", JSON.stringify(obj));
  }
}
// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(asyncRouterMap, lastRouter = false, type = false) {
  return asyncRouterMap.filter(route => {
    if (type && route.children) {
      route.children = filterChildren(route.children);
    }
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (route.component === "Layout") {
        route.component = Layout;
      } else if (route.component === "ParentView") {
        route.component = ParentView;
      } else {
        route.component = loadView(route.component);
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type);
    } else {
      delete route["children"];
      delete route["redirect"];
    }
    return true;
  });
}

function filterChildren(childrenMap, lastRouter = false) {
  var children = [];
  childrenMap.forEach((el, index) => {
    if (el.children && el.children.length) {
      if (el.component === "ParentView") {
        el.children.forEach(c => {
          c.path = el.path + "/" + c.path;
          if (c.children && c.children.length) {
            children = children.concat(filterChildren(c.children, c));
            return;
          }
          children.push(c);
        });
        return;
      }
    }
    if (lastRouter) {
      el.path = lastRouter.path + "/" + el.path;
    }
    children = children.concat(el);
  });
  return children;
}

export const loadView = view => {
  // 路由懒加载
  return resolve => require([`@/views/${view}`], resolve);
};

export default permission;
