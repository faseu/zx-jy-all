package com.youlai.boot.system.model.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.youlai.boot.common.base.BaseEntity;
import lombok.Getter;
import lombok.Setter;

/**
 * 设备实体对象
 *
 * @author youlaitech
 * @since 2026-01-20 20:17
 */
@Getter
@Setter
@TableName("t_device")
public class TDevice extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 设备编号
     */
    private String deviceNo;
    /**
     * 设备名称
     */
    private String deviceName;
    /**
     * 全网编号
     */
    private String entireNo;
    /**
     * 楼层名称
     */
    private String floorName;
    /**
     * 楼层id
     */
    private Long floorId;
    /**
     * 所属楼栋ID
     */
    private Long buildingId;
    /**
     * 所属楼栋名称
     */
    private String buildingName;
    /**
     * 所属监狱ID
     */
    private Long prisonId;
    /**
     * 所属监狱名称
     */
    private String prisonName;
    /**
     * 电源开关（0-开 1-关）
     */
    private Integer powerOff;
    /**
     * 功率配置
     */
    private Integer powerConfig;
    /**
     * IP地址
     */
    private String ipAddress;
    /**
     * 端口号
     */
    private Integer port;
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
    /**
     * 设备运行参数
     */
    private String parameters;
    /**
     * 开始时间
     */
    private String startTime;
    /**
     * 结束时间
     */
    private String endTime;

    private String positionX;

    private String positionY;

    private String voltage;
    private String electric_current ;

    private String radioFrequency  ;

    private String ch1              ;
    private String ch2              ;
    private String ch3              ;
    private String ch4              ;
    private String ch5              ;
    private String ch6              ;
    private String ch7              ;
    private String ch8              ;
    private String ch9              ;
    private String ch10             ;
    private String ch11             ;
    private String ch12             ;
    private String ch13             ;
    private String ch14             ;
    private String ch15             ;
    private String ch16             ;
    private String ch17             ;
    private String ch18             ;

    @TableField(exist = false)
    private int isAlarm;
}
