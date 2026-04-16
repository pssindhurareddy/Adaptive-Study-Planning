package com.studyflow.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * WebController — serves Thymeleaf page templates.
 * Maps URL routes to HTML template views.
 */
@Controller
public class WebController {

    @GetMapping({"/", "/dashboard"})
    public String dashboard(Model model) {
        model.addAttribute("activePage", "dashboard");
        return "dashboard";
    }

    @GetMapping("/tasks")
    public String tasks(Model model) {
        model.addAttribute("activePage", "tasks");
        return "tasks";
    }

    @GetMapping("/analytics")
    public String analytics(Model model) {
        model.addAttribute("activePage", "analytics");
        return "analytics";
    }
}
