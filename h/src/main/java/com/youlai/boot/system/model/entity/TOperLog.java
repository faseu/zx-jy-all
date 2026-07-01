package com.youlai.boot.system.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
@TableName("t_oper_log")
public class TOperLog implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String createBy;

    private Date loginTime;

    private Date operateTime;

    private String content;

    private String actionCode;

    private String moduleCode;

    private String targetType;

    private String targetId;

    private String targetName;

    private Long provinceId;

    private Long prisonId;

    private Integer prisonLevel;

    private String path;

    private String requestMethod;

    private String params;

    private Date createTime;

    private Integer isDeleted;
}
