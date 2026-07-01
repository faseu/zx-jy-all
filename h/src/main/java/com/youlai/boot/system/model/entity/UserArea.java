package com.youlai.boot.system.model.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 用户和区域关联表
 *
 * @author Rya.Hao
 * @since 2022/12/17
 */
@TableName("sys_user_area")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserArea {
    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 省份ID
     */
    private Long areaId;
}