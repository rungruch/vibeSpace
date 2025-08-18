import React, {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useState,
} from "react";
import { useCookies } from "react-cookie";
import {
  LOGIN_URL,
  MASTER_NANO_USER_INFO_URL,
} from "../../../constants/endpoints";
import { CurrentUser } from "../../interface";
import axios from "axios";
import { useAppState } from "./appStateContext.tsx";
import { fetchUserByEmpoyeeID } from "../../../api/users.ts";

export type UserContextType = CurrentUser | null;

export const UserContext = createContext<UserContextType>(null);

export const useUserContext = () => useContext(UserContext);

interface UserContextProviderProps {
  children: ReactNode;
}

//TODOS: handle user error case
// TODO GET employee apis 404 return error

export const UserContextProvider: React.FC<UserContextProviderProps> = ({
  children,
}) => {
  const { setLoading, setError, clearError, setUserRegistration } = useAppState();

  // State management
  const [cookies] = useCookies(["authen_info"]);
  const [employeecode, setEmployeecode] = useState<string | undefined>(() => {
    return cookies?.authen_info?.Auth.EmployeeCode ?? undefined;
  });
  const [userData, setUserData] = useState<CurrentUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function to fetch employee data
  const fetchEmployeeData = React.useCallback(async (empCode: string) => {
    try {
      // TODO: Uncomment when ready to use real API
      const params = {
        by: empCode,
      };

      const url = new URLSearchParams(params).toString();

      const endpoints = [
        axios.get(`${MASTER_NANO_USER_INFO_URL}${url ? `?${url}` : ""}`),
      ];

      const result = await axios.all(endpoints).then(
        axios.spread((USER_INFO_DATA) => ({
          USER_INFO_DATA: USER_INFO_DATA.data,
        }))
      );
      if (result.USER_INFO_DATA) {
        return {
          EmployeeCode: result.USER_INFO_DATA.EmployeeCode,
          TH_Name: result.USER_INFO_DATA.TH_Name,
          ENG_Name: result.USER_INFO_DATA.ENG_Name,
          ADUser: result.USER_INFO_DATA.ADUser,
          Email: result.USER_INFO_DATA.Email
        };
      }else{
        throw new Error('ไม่พบข้อมูลพนักงาน');
      }

    } catch (error) {
      console.error('Error fetching employee data:', error);
      throw new Error('ไม่สามารถดึงข้อมูลพนักงานได้');
    }
  }, []);

  // Main initialization effect
  useEffect(() => {
    const initializeUser = async () => {
      // Prevent multiple initializations
      if (isInitialized) return;

      try {
        setLoading(true, 'กำลังโหลดข้อมูล...');
        // clearError();

        // Step 1: Check authentication
        let currentEmployeeCode = employeecode;
        if (process.env.DEV_MODE === "development") { //if (process.env.DEV_MODE === "development") {
          console.log("Development mode - using mock employee code");
          currentEmployeeCode = "680621";
          setEmployeecode("680621");
          setUserData({
          id: "E2E1DB63-8E64-42C5-B68C-666741F6AF61",
          email: "mock-email",
          name: "mock-name",
          permissions: [],
          isInternal: true,
          EmployeeCode: "mock-employee-code",
          EmployeeData: {
            EmployeeCode: "mock-employee-code",
            TH_Name: "Mock Name",
            ENG_Name: "Mock Name",
            ADUser: "mock-aduser",
            Email: "mock-email"
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
          setIsInitialized(true);
          return;

        } else {
          if (!currentEmployeeCode) {
            console.error("No employee code found, redirecting to login");
            window.location.href = LOGIN_URL;
            return;
          }
        }

        
        // Step 2: Fetch employee data // actually no need to fetch but IDK
        const employeeData = await fetchEmployeeData(currentEmployeeCode);

        //step 3: Fetch user data, if no found start registration flow
        // TODOS register set permission and get permissions
        try {
          let userData = await fetchUserByEmpoyeeID(currentEmployeeCode);

        // Step 4: Create user object
        let currentUser: CurrentUser = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          permissions: [],
          isInternal: userData.is_internal,
          EmployeeCode: userData.employeeCode,
          EmployeeData: employeeData,
          isActive: userData.is_active,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at
        };

        setUserData(currentUser);
        setIsInitialized(true);
        }catch (error) {
          if (error.status === 404) {
            setUserRegistration(true, employeeData);
            return
          }else {
            throw error;
          }
        }

      } catch (error) {
        console.error('User initialization error:', error);
        setError(error? error : new Error('เกิดข้อผิดพลาดในการเริ่มต้นระบบ'));
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [isInitialized, employeecode]); // Simplified dependencies

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => userData, [userData]);

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
