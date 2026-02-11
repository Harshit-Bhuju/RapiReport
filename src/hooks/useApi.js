import { useState, useCallback } from "react";
import api from "../lib/api";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(
    async (endpoint, method = "GET", payload = null, config = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api({
          url: endpoint,
          method,
          data: payload,
          ...config,
        });

        setData(response.data);
        return { success: true, data: response.data };
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || "An error occurred";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const get = useCallback(
    (endpoint, config) => execute(endpoint, "GET", null, config),
    [execute],
  );
  const post = useCallback(
    (endpoint, data, config) => execute(endpoint, "POST", data, config),
    [execute],
  );
  const put = useCallback(
    (endpoint, data, config) => execute(endpoint, "PUT", data, config),
    [execute],
  );
  const del = useCallback(
    (endpoint, config) => execute(endpoint, "DELETE", null, config),
    [execute],
  );

  return { loading, error, data, get, post, put, del, execute };
};
