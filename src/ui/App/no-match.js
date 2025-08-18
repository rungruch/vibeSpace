import React from "react"
import { Link } from "react-router-dom";

import { Result, Button } from 'antd'

const NoMatch = () => (
    <Result
        status="404"
        title="เกิดข้อผิดพลาด"
        subTitle="ขออภัยไม่พบหน้าที่คุณค้นหา กรุณาตรวจสอบหน้าที่คุณต้องการอีกครั้ง."
        extra={(<Link to='/'><Button type="primary">กลับหน้าหลัก</Button></Link>)}
    />
)

export default NoMatch;