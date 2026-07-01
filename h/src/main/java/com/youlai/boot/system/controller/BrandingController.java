package com.youlai.boot.system.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.youlai.boot.core.exception.BusinessException;
import com.youlai.boot.core.web.Result;
import com.youlai.boot.security.util.SecurityUtils;
import com.youlai.boot.system.model.entity.Config;
import com.youlai.boot.system.model.vo.BrandingConfigVO;
import com.youlai.boot.system.service.ConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "System branding")
@RequestMapping("/api/v1/branding")
public class BrandingController {

    private static final String BRANDING_CONFIG_KEY = "SYSTEM_BRANDING";

    private final ConfigService configService;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;

    @Operation(summary = "Get system branding configuration")
    @GetMapping
    public Result<BrandingConfigVO> getBranding() {
        return Result.success(loadBrandingConfig());
    }

    @Operation(summary = "Update system branding configuration")
    @PutMapping
    public Result<BrandingConfigVO> updateBranding(@RequestBody BrandingConfigVO form) {
        if (!Long.valueOf(1L).equals(SecurityUtils.getUserId()) && !SecurityUtils.isRoot()) {
            throw new BusinessException("Only the first super administrator can update branding settings");
        }

        BrandingConfigVO config = mergeWithDefaults(form);
        String value;
        try {
            value = objectMapper.writeValueAsString(config);
        } catch (Exception e) {
            throw new BusinessException("Invalid branding settings", e);
        }

        Config entity = configService.getOne(
                new LambdaQueryWrapper<Config>().eq(Config::getConfigKey, BRANDING_CONFIG_KEY),
                false
        );
        if (entity == null) {
            entity = new Config();
            entity.setConfigKey(BRANDING_CONFIG_KEY);
            entity.setConfigName("System branding");
            entity.setCreateBy(SecurityUtils.getUserId());
            entity.setIsDeleted(0);
        } else {
            entity.setUpdateBy(SecurityUtils.getUserId());
        }
        ensureConfigValueCapacity();
        entity.setConfigValue(value);
        entity.setRemark("Header and login page branding");
        configService.saveOrUpdate(entity);
        configService.refreshCache();
        return Result.success(config);
    }

    private BrandingConfigVO loadBrandingConfig() {
        Object cachedValue = configService.getSystemConfig(BRANDING_CONFIG_KEY);
        String rawValue = cachedValue == null ? null : String.valueOf(cachedValue);
        if (StringUtils.isBlank(rawValue)) {
            Config entity = configService.getOne(
                    new LambdaQueryWrapper<Config>().eq(Config::getConfigKey, BRANDING_CONFIG_KEY),
                    false
            );
            rawValue = entity == null ? null : entity.getConfigValue();
        }

        if (StringUtils.isBlank(rawValue)) {
            return defaultBrandingConfig();
        }

        try {
            return mergeWithDefaults(objectMapper.readValue(rawValue, BrandingConfigVO.class));
        } catch (Exception e) {
            return defaultBrandingConfig();
        }
    }

    private BrandingConfigVO mergeWithDefaults(BrandingConfigVO form) {
        BrandingConfigVO defaults = defaultBrandingConfig();
        if (form == null) {
            return defaults;
        }
        defaults.setLogoUrl(defaultIfBlank(form.getLogoUrl(), defaults.getLogoUrl()));
        defaults.setLoginLogoUrl(defaultIfBlank(form.getLoginLogoUrl(), defaults.getLoginLogoUrl()));
        defaults.setLoginBackgroundUrl(defaultIfBlank(form.getLoginBackgroundUrl(), defaults.getLoginBackgroundUrl()));
        defaults.setBrandNameZh(defaultIfBlank(form.getBrandNameZh(), defaults.getBrandNameZh()));
        defaults.setBrandNameEn(defaultIfBlank(form.getBrandNameEn(), defaults.getBrandNameEn()));
        defaults.setBrandNameAr(defaultIfBlank(form.getBrandNameAr(), defaults.getBrandNameAr()));
        defaults.setLoginBrandNameZh(defaultIfBlank(form.getLoginBrandNameZh(), defaults.getLoginBrandNameZh()));
        defaults.setLoginBrandNameEn(defaultIfBlank(form.getLoginBrandNameEn(), defaults.getLoginBrandNameEn()));
        defaults.setLoginBrandNameAr(defaultIfBlank(form.getLoginBrandNameAr(), defaults.getLoginBrandNameAr()));
        defaults.setLoginWelcomeZh(defaultIfBlank(form.getLoginWelcomeZh(), defaults.getLoginWelcomeZh()));
        defaults.setLoginWelcomeEn(defaultIfBlank(form.getLoginWelcomeEn(), defaults.getLoginWelcomeEn()));
        defaults.setLoginWelcomeAr(defaultIfBlank(form.getLoginWelcomeAr(), defaults.getLoginWelcomeAr()));
        defaults.setLoginSystemNameZh(defaultIfBlank(form.getLoginSystemNameZh(), defaults.getLoginSystemNameZh()));
        defaults.setLoginSystemNameEn(defaultIfBlank(form.getLoginSystemNameEn(), defaults.getLoginSystemNameEn()));
        defaults.setLoginSystemNameAr(defaultIfBlank(form.getLoginSystemNameAr(), defaults.getLoginSystemNameAr()));
        return defaults;
    }

    private BrandingConfigVO defaultBrandingConfig() {
        BrandingConfigVO config = new BrandingConfigVO();
        config.setLogoUrl("/logo.png");
        config.setLoginLogoUrl("/logo.png");
        config.setLoginBackgroundUrl("");
        config.setBrandNameZh("Srill 干扰管理系统");
        config.setBrandNameEn("Srill Jamming Management System");
        config.setBrandNameAr("Srill نظام إدارة التشويش");
        config.setLoginBrandNameZh("SRILL LIMITED");
        config.setLoginBrandNameEn("SRILL LIMITED");
        config.setLoginBrandNameAr("SRILL LIMITED");
        config.setLoginWelcomeZh("欢迎使用");
        config.setLoginWelcomeEn("Salam, Welcome to");
        config.setLoginWelcomeAr("مرحبا بك في");
        config.setLoginSystemNameZh("干扰管理系统");
        config.setLoginSystemNameEn("Jamming Management System");
        config.setLoginSystemNameAr("نظام إدارة التشويش");
        return config;
    }

    private void ensureConfigValueCapacity() {
        try {
            jdbcTemplate.execute("ALTER TABLE sys_config MODIFY COLUMN config_value TEXT NOT NULL COMMENT '配置值'");
        } catch (Exception ignored) {
            // Existing deployments may already have a wider column or lack DDL permission.
        }
    }

    private String defaultIfBlank(String value, String defaultValue) {
        return StringUtils.isBlank(value) ? defaultValue : value;
    }
}
