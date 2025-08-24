import React, { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Result, Button, Space, Typography, Alert, Modal } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import Loading from "../loading";
import { useTheme } from "../../../context/themeContext.js";
import { createUser } from "../../../api/users.ts";
import { CreateUser } from "../Interfaces/interface.ts";

const { Text } = Typography;

export interface EmployeeData {
  ENG_Name: string;
  Email: string;
  EmployeeCode: string;
}

export interface AppState {
  isLoading: boolean;
  error: Error | null;
  loadingText: string;
  showRegistration: boolean;
  employeeData: EmployeeData | null;
}

interface AppStateContextType extends AppState {
  setAppState: (newState: Partial<AppState>) => void;
  setLoading: (loading: boolean, text?: string) => void;
  setError: (error: Error | null) => void;
  clearError: () => void;
  setUserRegistration: (show: boolean, employeeData: any) => void;
}

const defaultState: AppState = {
  isLoading: false,
  error: null,
  loadingText: "กำลังเรียกข้อมูล...",
  showRegistration: false,
  employeeData: null,
};

const AppStateContext = createContext<AppStateContextType | undefined>(
  undefined
);

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
};

interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [appState, setAppStateInternal] = useState<AppState>(defaultState);

  const setAppState = React.useCallback((newState: Partial<AppState>) => {
    setAppStateInternal((prev) => ({ ...prev, ...newState }));
  }, []);

  const setLoading = React.useCallback((loading: boolean, text?: string) => {
    setAppState({
      isLoading: loading,
      ...(text && { loadingText: text }),
    });
  }, [setAppState]);

  const setError = React.useCallback((error: Error | null) => {
    setAppState({ error });
  }, [setAppState]);

  const clearError = React.useCallback(() => {
    setAppState({ error: null });
  }, [setAppState]);

  const setUserRegistration = React.useCallback((show: boolean, employeeData: EmployeeData) => {
    setAppState({
      showRegistration: show,
      employeeData: show ? employeeData : null,
    });
  }, [setAppState]);

  const value = React.useMemo<AppStateContextType>(() => ({
    ...appState,
    setAppState,
    setLoading,
    setError,
    clearError,
    setUserRegistration,
  }), [appState, setAppState, setLoading, setError, clearError, setUserRegistration]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

// Enhanced AppWrapper that uses the AppState context and mimics the old Container behavior
export const AppWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    isLoading,
    error,
    loadingText,
    clearError,
    showRegistration,
    employeeData,
  } = useAppState();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleCloseError = () => {
    navigate("/");
    clearError();
  };

  if (showRegistration && employeeData) {
    return (
      <>
        <Modal
          title="ยอมรับข้อตกลงการใช้งาน"
          open={true}
          closable={false}
          footer={null}
          centered
        >
          <div style={{ marginBottom: 16 }}>
            กรุณายืนยันการลงทะเบียนใช้งานก่อนเข้าใช้งานระบบ
            <br />
            {/* You can put your T&C text here or link to a full document */}
          </div>
          <Button
            type="primary"
            // loading={registerLoading}
            onClick={async () => {
              try {
                // Call your registration API here
                const userData: CreateUser = {
                  name: employeeData.ENG_Name,
                  email: employeeData.Email,
                  password: null,
                  employeeCode: employeeData.EmployeeCode,
                  is_active: true,
                  is_internal: true,
                };
                await createUser(userData);
                clearError();
                window.location.reload();
              } catch (err) {
                Modal.error({
                  title: "เกิดข้อผิดพลาด",
                  content: "ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง",
                });
              }
            }}
          >
            ยอมรับและลงทะเบียน
          </Button>
        </Modal>
        {children}
      </>
    );
  } else if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100vh",
          minHeight: "100vh",
          backgroundColor: isDark ? "#27272a" : "#f0f2f5",
          color: isDark ? "#ffffff" : "#000000",
          transition: "background-color 0.3s ease, color 0.3s ease",
        }}
      >
        <Result
          style={{
            marginTop: "40px",
            color: isDark ? "#ffffff" : "#000000",
          }}
          status="500"
          subTitle={
            <Alert
              style={{
                textAlign: "left",
                backgroundColor: isDark ? "#3f3f46" : "#fff1f0",
                borderColor: isDark ? "#dc2626" : "#ffccc7",
                color: isDark ? "#ffffff" : "#000000",
              }}
              showIcon
              message="เกิดข้อผิดพลาด"
              description={error.message}
              type="error"
            />
          }
          extra={
            <Space>
              <Button
                danger
                style={{
                  width: "160px",
                  backgroundColor: isDark ? "#dc2626" : "#ff4d4f",
                  borderColor: isDark ? "#dc2626" : "#ff4d4f",
                  color: "#ffffff",
                }}
                icon={<CloseOutlined />}
                onClick={handleCloseError}
              >
                ปิด
              </Button>
            </Space>
          }
        />
      </div>
    );
  } else if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100vh",
          minHeight: "100vh",
          backgroundColor: isDark ? "#27272a" : "#f0f2f5",
          color: isDark ? "#ffffff" : "#000000",
          transition: "background-color 0.3s ease, color 0.3s ease",
        }}
      >
        <Space size="large" align="center" direction="vertical">
          <Loading />
          <Text
            style={{
              fontSize: "1.3em",
              color: isDark ? "#ffffff" : "#000000",
            }}
          >
            {loadingText}
          </Text>
        </Space>
      </div>
    );
  } else {
    return <>{children}</>;
  }
};
