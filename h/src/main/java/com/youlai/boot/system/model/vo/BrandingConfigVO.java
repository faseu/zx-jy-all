package com.youlai.boot.system.model.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "System branding configuration")
public class BrandingConfigVO {

    private String logoUrl;

    private String loginLogoUrl;

    private String loginBackgroundUrl;

    private String brandNameZh;

    private String brandNameEn;

    private String brandNameAr;

    private String loginBrandNameZh;

    private String loginBrandNameEn;

    private String loginBrandNameAr;

    private String loginWelcomeZh;

    private String loginWelcomeEn;

    private String loginWelcomeAr;

    private String loginSystemNameZh;

    private String loginSystemNameEn;

    private String loginSystemNameAr;
}
