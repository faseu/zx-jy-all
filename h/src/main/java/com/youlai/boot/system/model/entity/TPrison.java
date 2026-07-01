package com.youlai.boot.system.model.entity;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import com.baomidou.mybatisplus.annotation.TableName;
import com.youlai.boot.common.base.BaseEntity;

/**
 * 监狱实体对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:12
 */
@Getter
@Setter
@TableName("t_prison")
public class TPrison extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 监狱名称
     */
    private String name;
    /**
     * 监室数量
     */
    private Integer roomNumber;
    /**
     * 授权人员列表
     */
    private String authUsers;
    /**
     * 监狱等级（1-宽管监狱 2-普管监狱 3-严管监狱)
     */
    private Integer level;
    /**
     * 所属省份id
     */
    private Long deptId;
    /**
     * 所属省份
     */
    private String deptName;
    /**
     * 创建人ID
     */
    private Long createBy;
    /**
     * 修改人ID
     */
    private Long updateBy;
    /**
     * 逻辑删除标识(1-已删除 0-未删除)
     */
    private Integer isDeleted;
}
